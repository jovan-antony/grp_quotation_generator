'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { getApiUrl } from '@/lib/api-config';

interface SearchQuotationFormProps {
  onPreviewUpdate: (html: string) => void;
  onLoadQuotation?: (quotationData: any) => void;
}

export default function SearchQuotationForm({
  onPreviewUpdate,
  onLoadQuotation,
}: SearchQuotationFormProps) {
  const [filters, setFilters] = useState({
    recipientName: false,
    companyName: false,
    date: false,
    quoteNo: false,
  });

  const [searchValues, setSearchValues] = useState({
    recipientName: '',
    companyName: '',
    dateFrom: '',
    dateTo: '',
    fromCompany: '',
    yearMonth: '',
    series: '',
    quotationNumber: '',
  });

  const [dateFilterType, setDateFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);

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
      
      if (filters.date) {
        if (searchValues.dateFrom) {
          params.append('date_from', searchValues.dateFrom);
        }
        if (searchValues.dateTo) {
          params.append('date_to', searchValues.dateTo);
        }
      }
      
      if (filters.quoteNo) {
        // Send each component separately for independent filtering
        if (searchValues.fromCompany) {
          params.append('quote_company', searchValues.fromCompany);
        }
        if (searchValues.yearMonth) {
          params.append('quote_yearmonth', searchValues.yearMonth);
        }
        if (searchValues.series) {
          params.append('quote_series', searchValues.series);
        }
        if (searchValues.quotationNumber) {
          params.append('quote_number', searchValues.quotationNumber);
        }
      }
      
      const response = await fetch(getApiUrl(`api/quotations?${params.toString()}`));
      
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
      const response = await fetch(getApiUrl(`api/quotations/${quotation.id}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch quotation details');
      }
      
      const data = await response.json();
      setSelectedQuotation({ ...data.quotation, tanks: data.tanks });
      toast.success('Quotation loaded successfully');
      
      // Generate preview HTML for the selected quotation
      const previewHtml = generateQuotationPreview(data.quotation, data.tanks);
      onPreviewUpdate(previewHtml);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load quotation details');
    }
  };

  const generateQuotationPreview = (quotation: any, tanks: any[]) => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 4px;">
        <div style="background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px 0; font-weight: 600; font-size: 20px;">${quotation.from_company || 'Company'}</h2>
          <p style="margin: 0; opacity: 0.95; font-size: 14px; text-transform: uppercase;">QUOTATION</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 6px 0; font-size: 13px;"><strong>To:</strong> ${quotation.recipient_title} ${quotation.recipient_name}</p>
              <p style="margin: 6px 0; font-size: 13px;"><strong>Company:</strong> ${quotation.recipient_company}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 6px 0; font-size: 13px;"><strong>Quote No:</strong> ${quotation.quotation_number}</p>
              <p style="margin: 6px 0; font-size: 13px;"><strong>Date:</strong> ${new Date(quotation.quotation_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 13px;">
            Click "View Details" to see complete quotation information.
          </p>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6 pt-12">
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
                  autoComplete="off"
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
                  autoComplete="off"
                />
              </div>
            )}

            {filters.date && (
              <div className="space-y-2">
                <Label>Date Filter</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={dateFilterType === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('day');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'day' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Day
                  </Button>
                  <Button
                    type="button"
                    variant={dateFilterType === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('week');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'week' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Week
                  </Button>
                  <Button
                    type="button"
                    variant={dateFilterType === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDateFilterType('month');
                      setSearchValues({ ...searchValues, dateFrom: '', dateTo: '' });
                    }}
                    className={`text-xs flex-1 ${dateFilterType === 'month' ? 'bg-blue-400 text-white hover:bg-blue-500' : 'border border-blue-400 text-blue-600 bg-white hover:bg-blue-50'}`}
                  >
                    Month
                  </Button>
                </div>
                
                {dateFilterType === 'day' && (
                  <div>
                    <Label htmlFor="searchDate" className="text-xs text-gray-600">Select Date</Label>
                    <Input
                      id="searchDate"
                      type="date"
                      value={searchValues.dateFrom}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setSearchValues({ ...searchValues, dateFrom: selectedDate, dateTo: selectedDate });
                      }}
                      autoComplete="off"
                    />
                  </div>
                )}

                {dateFilterType === 'week' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="searchWeekFrom" className="text-xs text-gray-600">Week Start</Label>
                      <Input
                        id="searchWeekFrom"
                        type="date"
                        value={searchValues.dateFrom}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateFrom: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="searchWeekTo" className="text-xs text-gray-600">Week End</Label>
                      <Input
                        id="searchWeekTo"
                        type="date"
                        value={searchValues.dateTo}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateTo: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}

                {dateFilterType === 'month' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="searchMonthFrom" className="text-xs text-gray-600">Month Start</Label>
                      <Input
                        id="searchMonthFrom"
                        type="date"
                        value={searchValues.dateFrom}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateFrom: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="searchMonthTo" className="text-xs text-gray-600">Month End</Label>
                      <Input
                        id="searchMonthTo"
                        type="date"
                        value={searchValues.dateTo}
                        onChange={(e) =>
                          setSearchValues({ ...searchValues, dateTo: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {filters.quoteNo && (
              <div className="space-y-2">
                <Label>Quote Number Components (Each can filter independently)</Label>
                <p className="text-xs text-gray-500">Example: GRPPT/2512/MM/0324</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="fromCompanyQuoteNo" className="text-xs text-gray-600">Company Code</Label>
                    <Input
                      id="fromCompanyQuoteNo"
                      placeholder="e.g., GRPPT"
                      value={searchValues.fromCompany}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          fromCompany: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearMonthQuoteNo" className="text-xs text-gray-600">YY/MM</Label>
                    <Input
                      id="yearMonthQuoteNo"
                      placeholder="e.g., 2512"
                      value={searchValues.yearMonth}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          yearMonth: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seriesQuoteNo" className="text-xs text-gray-600">Series</Label>
                    <Input
                      id="seriesQuoteNo"
                      placeholder="e.g., MM, JB"
                      value={searchValues.series}
                      onChange={(e) =>
                        setSearchValues({ ...searchValues, series: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberQuoteNo" className="text-xs text-gray-600">Number</Label>
                    <Input
                      id="numberQuoteNo"
                      placeholder="e.g., 0324"
                      value={searchValues.quotationNumber}
                      onChange={(e) =>
                        setSearchValues({
                          ...searchValues,
                          quotationNumber: e.target.value,
                        })
                      }
                      autoComplete="off"
                    />
                  </div>
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
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedQuotation?.id === quotation.id
                      ? 'border-blue-400 bg-blue-50/50'
                      : 'border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm cursor-pointer" onClick={() => handleSelectQuotation(quotation)}>
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
                    {onLoadQuotation && (
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // Fetch full quotation details before loading
                            const response = await fetch(getApiUrl(`api/quotations/${quotation.id}`));
                            if (!response.ok) {
                              throw new Error('Failed to fetch quotation details');
                            }
                            const data = await response.json();
                            onLoadQuotation(data);
                            toast.success('Loading quotation to Revision page...');
                          } catch (error) {
                            console.error('Error fetching quotation:', error);
                            toast.error('Failed to load quotation');
                          }
                        }}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg px-4 py-2 text-xs shrink-0"
                      >
                        Load
                      </Button>
                    )}
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
                <span className="font-semibold">Revision:</span>{' '}
                {selectedQuotation.revision_number}
              </div>
              <div>
                <span className="font-semibold">Tanks:</span>{' '}
                {selectedQuotation.tanks?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
