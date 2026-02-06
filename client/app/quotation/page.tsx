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
    <div className="min-h-screen bg-blue-50">
      {/* Fixed Header with Title and Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-blue-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          {/* Header title removed as requested */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white border border-blue-200 p-1.5 h-11 rounded-xl shadow-sm">
              <TabsTrigger
                value="new"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white data-[state=inactive]:text-blue-600 data-[state=inactive]:bg-transparent transition-all duration-200 h-8 hover:text-blue-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  New Quotation
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="revision"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white data-[state=inactive]:text-blue-600 data-[state=inactive]:bg-transparent transition-all duration-200 h-8 hover:text-blue-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Content Section with further reduced top padding for minimal gap below header */}
      <div className="container mx-auto px-6 pt-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-2 lg:order-1">
              <Card className="border border-blue-200 rounded-xl shadow-sm sticky top-[105px] bg-white">
                <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
                  <CardTitle className="text-base font-semibold">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6">
                  <div>
                    {previewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 py-12">
                        <p className="text-sm">Preview will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <TabsContent value="new" className="mt-8">
                <NewQuotationForm onPreviewUpdate={setPreviewHtml} />
              </TabsContent>

              <TabsContent value="revision" className="mt-8">
                <QuotationRevisionForm onPreviewUpdate={setPreviewHtml} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
