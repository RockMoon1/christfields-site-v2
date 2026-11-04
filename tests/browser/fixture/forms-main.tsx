import React from 'react';
import { createRoot } from 'react-dom/client';
import AvailabilityForm from '@/components/forms/AvailabilityForm';
import FormsLayout from '@/app/forms/layout';
import '@/app/globals.css';
createRoot(document.getElementById('root')!).render(<FormsLayout><h1 className="font-display text-5xl">Let’s get outside.</h1><AvailabilityForm /></FormsLayout>);
