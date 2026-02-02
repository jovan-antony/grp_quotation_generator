'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewQuotationForm from '@/components/quotation/NewQuotationForm';
import QuotationRevisionForm from '@/components/quotation/QuotationRevisionForm';
import { Paytone_One } from 'next/font/google';

const paytoneOne = Paytone_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function QuotationPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [previewHtml, setPreviewHtml] = useState('');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Header with Title and Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className={`text-3xl text-slate-800 text-center mb-3 ${paytoneOne.className}`}>
            GRP Tanks Quotation Generator
          </h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-100 p-1 h-10 rounded-lg">
              <TabsTrigger
                value="new"
                className="text-sm font-medium rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent transition-all h-8"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  New Quotation
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="revision"
                className="text-sm font-medium rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent transition-all h-8"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Quotation Revision
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Section with top padding to account for fixed header - GAP ADJUSTMENT: pt-32 (8rem = 128px top padding) */}
      <div className="container mx-auto px-4 pt-32 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-2 lg:order-1">
              <Card className="border-0 rounded-lg sticky top-36">
                <CardHeader className="bg-white text-black border-b-2 border-slate-200 rounded-t-lg">
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div>
                    {previewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        Preview will appear here
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <TabsContent value="new" className="mt-0">
                <NewQuotationForm onPreviewUpdate={setPreviewHtml} />
              </TabsContent>

              <TabsContent value="revision" className="mt-0">
                <QuotationRevisionForm onPreviewUpdate={setPreviewHtml} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
