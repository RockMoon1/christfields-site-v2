import {it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({database:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@clerk/nextjs/server',()=>({currentUser:async()=>null}));
vi.mock('@/lib/supabase',()=>({getSupabase:m.database}));
import {getOrganizerForm} from './server';
it('protects the direct settings read before accessing any event',async()=>{expect(await getOrganizerForm('november-2026-car-camping')).toBeNull();expect(m.database).not.toHaveBeenCalled();});
