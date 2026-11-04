import {parseSettings} from '@/lib/forms/events';
export async function saveEvent(form:FormData){if(!parseSettings(JSON.parse(String(form.get('settings')))))throw Error('Invalid settings.');(window as unknown as {savedEvent:unknown}).savedEvent=JSON.parse(String(form.get('settings')));}
export async function uploadEventPhoto(){throw Error('Uploads are not sent from this fixture.');}
export async function previewClimate(){throw Error('No provider calls from this fixture.');}
