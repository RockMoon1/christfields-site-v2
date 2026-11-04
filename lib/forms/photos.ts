import 'server-only';
import sharp from 'sharp';
export async function safeEventPhoto(bytes:Uint8Array):Promise<string>{
 if(!bytes.length||bytes.length>500000)throw Error('Choose an image under 500 KB.');
 const input=sharp(bytes,{limitInputPixels:16000000,animated:false});const m=await input.metadata();
 if(!['jpeg','png','webp'].includes(m.format||'')||(m.pages||1)>1)throw Error('Use a still JPEG, PNG or WebP image.');
 const output=await input.rotate().resize({width:1280,height:960,fit:'inside',withoutEnlargement:true}).webp({quality:75}).toBuffer();
 if(output.length>300000)throw Error('Choose a smaller image.');
 return output.toString('base64');
}
