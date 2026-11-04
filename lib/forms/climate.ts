import 'server-only';
export const STATION_ID=/^[A-Z0-9]{11}$/;
export type ClimateMonth={high:number|null;low:number|null;precipitation:number|null};
export type ClimateNormals={station:string;name:string;latitude:number;longitude:number;elevation:number;months:Record<string,ClimateMonth>;retrieved:string;source:string};
const number=(v:unknown,min:number,max:number)=>{if(typeof v!=='string'||!/^\s*-?\d+(\.\d+)?\s*$/.test(v))return null;const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:null;};
export function parseNormals(value:unknown,station:string):ClimateNormals|null{
 if(!STATION_ID.test(station)||!Array.isArray(value)||!value.length||value.length>12)return null;
 const first=value[0];if(!first||typeof first.NAME!=='string'||!first.NAME.trim()||first.NAME.length>160)return null;
 const latitude=number(first.LATITUDE,-90,90),longitude=number(first.LONGITUDE,-180,180),elevation=number(first.ELEVATION,-500,9000);
 if(latitude===null||longitude===null||elevation===null)return null;
 const months:Record<string,ClimateMonth>={};
 for(const r of value){if(!r||r.STATION!==station||typeof r.DATE!=='string'||! /^(0[1-9]|1[0-2])$/.test(r.DATE)||months[r.DATE])return null;
  const high=number(r['MLY-TMAX-NORMAL'],-100,140),low=number(r['MLY-TMIN-NORMAL'],-100,140),precipitation=number(r['MLY-PRCP-NORMAL'],0,200);
  if(high!==null&&low!==null&&low>high)return null;months[r.DATE]={high,low,precipitation};
 }
 if(!Object.values(months).some(m=>m.high!==null||m.low!==null||m.precipitation!==null))return null;
 return {station,name:first.NAME.trim(),latitude,longitude,elevation,months,retrieved:new Date().toISOString(),source:`https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=${station}&format=json&units=standard&includeStationName=true&includeStationLocation=true&dataTypes=MLY-TMAX-NORMAL,MLY-TMIN-NORMAL,MLY-PRCP-NORMAL`};
}
export async function climateNormals(station:string):Promise<ClimateNormals|null>{
 if(!STATION_ID.test(station))return null;
 const url=`https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=${station}&format=json&units=standard&includeStationName=true&includeStationLocation=true&dataTypes=MLY-TMAX-NORMAL,MLY-TMIN-NORMAL,MLY-PRCP-NORMAL`;
 try{const r=await fetch(url,{next:{revalidate:604800},headers:{Accept:'application/json','User-Agent':'ChristFieldsForms/2.0'},redirect:'error',signal:AbortSignal.timeout(8000)});if(!r.ok)return null;
  const reader=r.body?.getReader();if(!reader)return null;let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return null;}chunks.push(value);}
  return parseNormals(JSON.parse(Buffer.concat(chunks).toString('utf8')),station);
 }catch{return null;}
}
