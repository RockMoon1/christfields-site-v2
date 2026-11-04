import {it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/forms/server',()=>({isFormsOrganizer:async()=>false}));
const database=vi.hoisted(()=>vi.fn());vi.mock('@/lib/supabase',()=>({getSupabase:database}));
import {saveEvent,setAttendance,setPollEnabled,uploadEventPhoto} from '@/app/dashboard/(app)/forms/actions';
it('rejects every organizer mutation before reading payloads or accessing storage',async()=>{for(const fn of [saveEvent,setAttendance,setPollEnabled,uploadEventPhoto])await expect(fn(new FormData())).rejects.toThrow('Not authorized');expect(database).not.toHaveBeenCalled();});
