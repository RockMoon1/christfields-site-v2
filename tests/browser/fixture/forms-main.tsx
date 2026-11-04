import React from 'react';
import { createRoot } from 'react-dom/client';
import AvailabilityForm from '@/components/forms/AvailabilityForm';
import FormsLayout from '@/app/forms/layout';
import '@/app/globals.css';
import {DEFAULT_EVENT} from '@/lib/forms/events';
const contacts=location.search.includes('contacts');
createRoot(document.getElementById('root')!).render(<FormsLayout><h1 className="font-display text-5xl">Let's get outside.</h1><AvailabilityForm settings={contacts?{...DEFAULT_EVENT,email:'required',phone:'optional',receipts:true,moreInfo:true,information:'Bring a warm layer. Details will be confirmed.',end:'2026-12-02'}:DEFAULT_EVENT}/></FormsLayout>);
