'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewQuotationForm from '@/components/quotation/NewQuotationForm';
import SearchQuotationForm from '@/components/quotation/SearchQuotationForm';
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
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loadQuotationData, setLoadQuotationData] = useState<any>(null);
  const [isPageReload, setIsPageReload] = useState(true);

  const COMPANY_HEADER_MAP: Record<string, string> = {
    'GRP':   '/header-images/GRP.png',
    'GRPPT': '/header-images/GRPPT.png',
    'CLX':   '/header-images/CLX.png',
  };

  // Detect if this is a page reload and clear sessionStorage
  useEffect(() => {
    // Check if this is a page reload (not just component mount)
    const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const isReload = perfEntries.length > 0 && perfEntries[0].type === 'reload';
    
    if (isReload || !sessionStorage.getItem('appInitialized')) {
      // This is a fresh page load or reload
      sessionStorage.removeItem('newQuotationFormData');
      sessionStorage.removeItem('quotationRevisionFormData');
      sessionStorage.removeItem('searchQuotationFormData');
      sessionStorage.setItem('appInitialized', 'true');
      setIsPageReload(true);
      console.log('✓ All form data cleared on page load/reload');
    } else {
      // This is just a component remount (shouldn't happen but handle it)
      setIsPageReload(false);
      console.log('✓ App already initialized, keeping sessionStorage');
    }
    
    // Clear the initialization flag when the user closes/navigates away
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('appInitialized');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLoadQuotation = (quotationData: any) => {
    console.log('📥 Loading quotation data to revision form:', quotationData);
    setLoadQuotationData(quotationData);
    setActiveTab('revision');
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Fixed Header with Title and Tabs */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-blue-200 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          {/* Header title removed as requested */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-white border border-blue-200 p-1.5 h-11 rounded-xl shadow-sm">
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
                value="search"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white data-[state=inactive]:text-blue-600 data-[state=inactive]:bg-transparent transition-all duration-200 h-8 hover:text-blue-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  Search Quotation
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="revision"
                className="text-sm font-medium rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white data-[state=inactive]:text-blue-600 data-[state=inactive]:bg-transparent transition-all duration-200 h-8 hover:text-blue-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-2.7-6.3L21 8M21 3v5h-5"/>
                  </svg>
                  Quotation Revision
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Section with proper top padding to avoid header overlap */}
      <div className="container mx-auto px-6 pt-20 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="order-2 lg:order-1 lg:pt-8">
              <div className="sticky top-28 rounded-xl overflow-hidden bg-white" style={{ border: '1px solid #d1d5db' }}>
                <div className="border-b" style={{ borderColor: '#f3f4f6' }}>
                  {selectedCompany && COMPANY_HEADER_MAP[selectedCompany] ? (
                    <img
                      src={COMPANY_HEADER_MAP[selectedCompany]}
                      alt={selectedCompany}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  ) : (
                    <div className="px-6 py-4">
                      <span className="text-base font-semibold text-blue-600">Live Preview</span>
                    </div>
                  )}
                </div>
                <div
                  className="overflow-y-auto"
                  style={{ maxHeight: 'calc(100vh - 12rem)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <style>{`.preview-scroll::-webkit-scrollbar { display: none; }`}</style>
                  {previewHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  ) : (
                    <div className="flex items-center justify-center text-gray-400 py-16">
                      <p className="text-sm">Preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <TabsContent value="new" className="-mt-4">
                <NewQuotationForm onPreviewUpdate={setPreviewHtml} onCompanyChange={setSelectedCompany} isActive={activeTab === 'new'} isPageReload={isPageReload} />
              </TabsContent>

              <TabsContent value="search" className="-mt-4">
                <SearchQuotationForm onPreviewUpdate={setPreviewHtml} onLoadQuotation={handleLoadQuotation} onCompanyChange={setSelectedCompany} isActive={activeTab === 'search'} isPageReload={isPageReload} />
              </TabsContent>

              <TabsContent value="revision" className="-mt-4">
                <QuotationRevisionForm onPreviewUpdate={setPreviewHtml} loadQuotationData={loadQuotationData} onCompanyChange={setSelectedCompany} isActive={activeTab === 'revision'} isPageReload={isPageReload} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
