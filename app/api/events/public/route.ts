import {NextResponse} from 'next/server';
import {getSupabase} from '@/lib/supabase';
import {publishedEvent} from '@/lib/forms/published';
export const dynamic='force-dynamic';
export async function GET(){
 const headers={'Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Netlify-CDN-Cache-Control':'no-store'};
 try{const {data,error}=await getSupabase().from('activity_forms').select('slug,enabled,settings,photo_version').eq('enabled',true).eq('settings->>publishToSite','true').order('updated_at',{ascending:false}).limit(50);
 if(error)return NextResponse.json({events:[]},{status:503,headers});
 return NextResponse.json({events:(data||[]).map(f=>publishedEvent(f)).filter(Boolean)},{headers});
 }catch{return NextResponse.json({events:[]},{status:503,headers});}
}
