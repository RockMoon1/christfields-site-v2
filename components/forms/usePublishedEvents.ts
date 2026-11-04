'use client';
import {useEffect,useState} from 'react';
import type {PublishedEvent} from '@/lib/forms/published';

/** Public projection only. Refresh on focus and clear stale listings on failure. */
export function usePublishedEvents(){
 const [events,setEvents]=useState<PublishedEvent[]>([]);
 useEffect(()=>{
  let active=true,sequence=0;
  const controller=new AbortController();
  const load=async()=>{const request=++sequence;try{
   const response=await fetch('/api/events/public',{cache:'no-store',signal:controller.signal});
   const data=await response.json();
   if(active&&request===sequence)setEvents(response.ok&&Array.isArray(data.events)?data.events:[]);
  }catch{if(active&&request===sequence)setEvents([]);}};
  void load();const timer=setInterval(load,60000);window.addEventListener('focus',load);
  return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('focus',load);};
 },[]);
 return events;
}
