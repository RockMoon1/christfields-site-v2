import {getSupabase} from '@/lib/supabase';
import {getPublicForm,formOpen} from '@/lib/forms/server';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const form=await getPublicForm(slug);if(!form||!formOpen(form))return new Response(null,{status:404});
 const {data,error}=await getSupabase().from('activity_form_photos').select('image_base64').eq('form_slug',slug).maybeSingle();
 if(error||!data)return new Response(null,{status:404});
 return new Response(new Uint8Array(Buffer.from(data.image_base64,'base64')),{headers:{'Content-Type':'image/webp','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
}
