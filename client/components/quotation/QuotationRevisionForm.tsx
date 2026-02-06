'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileDown, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface QuotationRevisionFormProps {
  onPreviewUpdate: (html: string) => void;
}

export default function QuotationRevisionForm({
  onPreviewUpdate,
}: QuotationRevisionFormProps) {
  const [filters, setFilters] = useState({
    recipientName: false,
    companyName: false,
    date: false,
    quoteNo: false,
  });

  const [searchValues, setSearchValues] = useState({
    recipientName: '',
    companyName: '',
    date: new Date().toISOString().split('T')[0],
    fromCompany: '',
    yearMonth: '',
    series: '',
    quotationNumber: '',
  });

  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [revisionNumber, setRevisionNumber] = useState('');

  const handleSearch = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.recipientName && searchValues.recipientName) {
        params.append('recipient_name', searchValues.recipientName);
      }
      
      if (filters.companyName && searchValues.companyName) {
        params.append('company_name', searchValues.companyName);
      }
      
      if (filters.date && searchValues.date) {
        params.append('date', searchValues.date);
      }
      
      if (filters.quoteNo) {
        let quoteNoPattern = '';
        if (searchValues.fromCompany) quoteNoPattern += searchValues.fromCompany;
        if (searchValues.yearMonth) quoteNoPattern += searchValues.yearMonth;
        if (searchValues.series) quoteNoPattern += searchValues.series;
        if (searchValues.quotationNumber) quoteNoPattern += searchValues.quotationNumber;
        
        if (quoteNoPattern) {
          params.append('quotation_number', quoteNoPattern);
        }
      }
      
      const response = await fetch(`http://localhost:8000/api/quotations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotations');
      }
      
      const data = await response.json();
      setQuotations(data.quotations || []);
      toast.success(`Found ${data.count || 0} quotation(s)`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to search quotations');
    }
  };

  const handleSelectQuotation = async (quotation: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/quotations/${quotation.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotation details');
      }
      
      const data = await response.json();
      setSelectedQuotation({ ...data.quotation, tanks: data.tanks });
      toast.success('Quotation loaded successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load quotation details');
    }
  };

  const handleExportRevision = async () => {
    if (!selectedQuotation || !revisionNumber) {
      toast.error('Please select a quotation and enter revision number');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/quotations/${selectedQuotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revision_number: parseInt(revisionNumber)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update revision');
      }
      
      const data = await response.json();
      toast.success('Revision updated successfully!');

      const generateResponse = await fetch('/api/generate-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: data.id,
        }),
      });

      if (generateResponse.ok) {
        const blob = await generateResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation_${data.quotation_number}_rev${revisionNumber}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to export revision');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
        <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
          <CardTitle className="flex items-center text-base font-semibold">
            <Filter className="mr-2 h-5 w-5" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterRecipientName"
                checked={filters.recipientName}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, recipientName: checked as boolean })
                }
              />
              <Label htmlFor="filterRecipientName" className="cursor-pointer">
                Recipient Name
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterCompanyName"
                checked={filters.companyName}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, companyName: checked as boolean })
                }
              />
              <Label htmlFor="filterCompanyName" className="cursor-pointer">
                Company Name
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterDate"
                checked={filters.date}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, date: checked as boolean })
                }
              />
              <Label htmlFor="filterDate" className="cursor-pointer">
                Date
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterQuoteNo"
                checked={filters.quoteNo}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, quoteNo: checked as boolean })
                }
              />
              <Label htmlFor="filterQuoteNo" className="cursor-pointer">
                Quote No
              </Label>
            </div>
          </div>

          <div className="space-y-4">
            {filters.recipientName && (
              <div>
                <Label htmlFor="searchRecipientName">Recipient Name</Label>
                <Input
                  id="searchRecipientName"
                  value={searchValues.recipientName}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      recipientName: e.target.value,
                    })
                  }
                  placeholder="Enter recipient name"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#searchCompanyName');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}

            {filters.companyName && (
              <div>
                <Label htmlFor="searchCompanyName">Company Name</Label>
                <Input
                  id="searchCompanyName"
                  value={searchValues.companyName}
                  onChange={(e) =>
                    setSearchValues({
                      ...searchValues,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="Enter company name"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#searchDate');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}

            {filters.date && (
              <div>
                <Label htmlFor="searchDate">Date (DD/MM/YYYY)</Label>
                <Input
                  id="searchDate"
                  type="date"
                  value={searchValues.date}
                  onChange={(e) =>
                    setSearchValues({ ...searchValues, date: e.target.value })
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const next = document.querySelector('#fromCompanyQuoteNo');
                      if (next) (next as HTMLElement).focus();
                    }
                  }}
                />
              </div>
            )}

            {filters.quoteNo && (
              <div className="space-y-2">
                <Label>Quote Number Components</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input
                    id="fromCompanyQuoteNo"
                    placeholder="Company"
                    value={searchValues.fromCompany}
                    onChange={(e) =>
                      setSearchValues({
                        ...searchValues,
                        fromCompany: e.target.value,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#yearMonthQuoteNo');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                  />
                  <Input
                    id="yearMonthQuoteNo"
                    placeholder="YY/MM"
                    value={searchValues.yearMonth}
                    onChange={(e) =>
                      setSearchValues({
                        ...searchValues,
                        yearMonth: e.target.value,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#seriesQuoteNo');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                  />
                  <Input
                    id="seriesQuoteNo"
                    placeholder="Series"
                    value={searchValues.series}
                    onChange={(e) =>
                      setSearchValues({ ...searchValues, series: e.target.value })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const next = document.querySelector('#numberQuoteNo');
                        if (next) (next as HTMLElement).focus();
                      }
                    }}
                  />
                  <Input
                    id="numberQuoteNo"
                    placeholder="Number"
                    value={searchValues.quotationNumber}
                    onChange={(e) =>
                      setSearchValues({
                        ...searchValues,
                        quotationNumber: e.target.value,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        // Optionally focus search button or blur
                        (e.target as HTMLElement).blur();
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            className="w-full bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 shadow-sm font-medium"
          >
            <Search className="mr-2 h-4 w-4" />
            Search Quotations
          </Button>
        </CardContent>
      </Card>

      {quotations.length > 0 && (
        <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
          <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
            <CardTitle className="text-base font-semibold">Search Results ({quotations.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedQuotation?.id === quotation.id
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectQuotation(quotation)}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">Quote No:</span>{' '}
                      {quotation.quotation_number}
                    </div>
                    <div>
                      <span className="font-semibold">Recipient:</span>{' '}
                      {quotation.recipient_name}
                    </div>
                    <div>
                      <span className="font-semibold">Company:</span>{' '}
                      {quotation.recipient_company}
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(quotation.quotation_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedQuotation && (
        <Card className="border border-blue-200 rounded-xl shadow-sm bg-white">
          <CardHeader className="bg-white text-blue-600 border-b border-blue-200 rounded-t-xl px-6 py-4">
            <CardTitle className="text-base font-semibold">Selected Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <span className="font-semibold">From:</span>{' '}
                {selectedQuotation.from_company}
              </div>
              <div>
                <span className="font-semibold">To:</span>{' '}
                {selectedQuotation.recipient_title} {selectedQuotation.recipient_name}
              </div>
              <div>
                <span className="font-semibold">Company:</span>{' '}
                {selectedQuotation.recipient_company}
              </div>
              <div>
                <span className="font-semibold">Subject:</span>{' '}
                {selectedQuotation.subject}
              </div>
              <div>
                <span className="font-semibold">Current Revision:</span>{' '}
                {selectedQuotation.revision_number}
              </div>
              <div>
                <span className="font-semibold">Tanks:</span>{' '}
                {selectedQuotation.tanks?.length || 0}
              </div>
            </div>

            <div>
              <Label htmlFor="revisionNumber">New Revision Number</Label>
              <Input
                id="revisionNumber"
                type="number"
                min="1"
                value={revisionNumber}
                onChange={(e) => setRevisionNumber(e.target.value)}
                placeholder="Enter revision number"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const next = document.querySelector('#exportRevisionBtn');
                    if (next) (next as HTMLElement).focus();
                  }
                }}
              />
            </div>

            <Button
              id="exportRevisionBtn"
              onClick={handleExportRevision}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white py-6 text-base rounded-xl transition-colors duration-200 shadow-sm font-medium"
            >
              <FileDown className="mr-2 h-5 w-5" />
              Export Quotation Revision
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
