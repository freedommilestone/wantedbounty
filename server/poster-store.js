import { createHash, timingSafeEqual } from 'node:crypto';

export const hash = value => createHash('sha256').update(value).digest('hex');
export class PublicError extends Error {
  constructor(message, status=400) { super(message); this.status=status; }
}
export function configuration() {
  const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
  const key=process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !process.env.CHATGPT_API_SECRET_KEY)
    throw new PublicError('Poster generation is not configured yet. No payment has been requested.',503);
  return {url,key};
}
export async function supabase(path, options={}) {
  const {url,key}=configuration();
  const response=await fetch(`${url}${path}`, {
    ...options, signal:AbortSignal.timeout(15000),
    headers:{apikey:key,...(key.startsWith('eyJ')?{Authorization:`Bearer ${key}`} : {}),...options.headers},
  });
  if (!response.ok) {
    const message=await response.text();
    if(message.includes('ORDER_RATE_LIMIT')) throw new PublicError('Too many poster requests. Please try again later.',429);
    throw new PublicError('Poster storage is unavailable. Your existing order is safe; please retry later.',503);
  }
  return response;
}
export async function database(path, method='GET', body) {
  const response=await supabase(`/rest/v1/${path}`,{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();
  return text?JSON.parse(text):null;
}
export async function loadOrder(id,token) {
  if(!/^[a-f0-9-]{36}$/.test(id??'') || !/^[a-f0-9]{64}$/.test(token??'')) throw new PublicError('Invalid order access.',401);
  const [order]=await database(`poster_orders?id=eq.${id}&select=*`);
  if(!order || !timingSafeEqual(Buffer.from(order.token_hash,'hex'),Buffer.from(hash(token),'hex')))
    throw new PublicError('Order not found.',404);
  return order;
}
export const updateOrder=(id,patch)=>database(`poster_orders?id=eq.${id}`,'PATCH',patch);
export async function putImage(path,bytes) {
  await supabase(`/storage/v1/object/poster-private/${path}`,{method:'POST',headers:{'Content-Type':'image/jpeg','x-upsert':'true'},body:bytes});
}
export async function getImage(path) {
  return Buffer.from(await (await supabase(`/storage/v1/object/authenticated/poster-private/${path}`)).arrayBuffer());
}
export async function result(order) {
  const base={id:order.id,status:order.status,signature:order.signature,details:order.details};
  if(order.status==='ready') base.image=`data:image/jpeg;base64,${(await getImage(order.result_path)).toString('base64')}`;
  if(order.status==='review' || (order.status==='generating' && Date.now()-Date.parse(order.started_at)>300000)) {
    base.status='review';
    base.message=`Generation needs assistance. Keep order ${order.id} and your transaction receipt. Do not pay again.`;
  }
  return base;
}
