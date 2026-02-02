'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewQuotationForm from '@/components/quotation/NewQuotationForm';
import QuotationRevisionForm from '@/components/quotation/QuotationRevisionForm';

export default function QuotationPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [previewHtml, setPreviewHtml] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            GRP TANKS Quotation Generator
          </h1>
          <p className="text-slate-600">
            Create and manage professional quotations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white shadow-md h-12 xl">
            <TabsTrigger
              value="new"
              className="xl data-[state=active]:bg-white data-[state=active]:text-black transition-all"
            >
              New Quotation
            </TabsTrigger>
            <TabsTrigger
              value="revision"
              className="xl data-[state=active]:bg-white data-[state=active]:text-black transition-all"
            >
              Quotation Revision
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-2 lg:order-1">
              <div className="bg-white xl shadow-lg p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Live Preview
                </h3>
                <div className="border border-slate-200 lg p-4 min-h-[600px] bg-white overflow-auto">
                  {previewHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Preview will appear here
                    </div>
                  )}
                </div>
              </div>
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
