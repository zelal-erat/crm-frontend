import React, { useState, useEffect } from 'react';
import { invoiceService, customerService, serviceService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [processingRenewals, setProcessingRenewals] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPagination, setSearchPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const { canCreate, canUpdate, canDelete } = useAuth();

  // Fatura durumları
  const invoiceStatuses = [
    { value: 'Pending', label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Paid', label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    { value: 'Overdue', label: 'Gecikmiş', color: 'bg-red-100 text-red-800' },
    { value: 'Cancelled', label: 'İptal', color: 'bg-gray-100 text-gray-800' }
  ];

  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    status: 'Pending',
    items: [{ serviceId: '', renewalCycle: 'None', price: '', quantity: 1, description: '', vat: 18, startDate: '' }]
  });

  useEffect(() => {
    loadData();
  }, []);

  // Arama fonksiyonu
  const handleSearch = async (pageNumber = 1) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await invoiceService.search(searchTerm.trim(), pageNumber, 10);
      const data = response.data?.data || response.data;
      
      setSearchResults(data.items || []);
      setSearchPagination({
        pageNumber: data.pageNumber || 1,
        pageSize: data.pageSize || 10,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
        hasPreviousPage: data.hasPreviousPage || false,
        hasNextPage: data.hasNextPage || false
      });
    } catch (error) {
      console.error('Arama yapılırken hata:', error);
      setSearchResults([]);
      alert('Arama yapılırken hata oluştu!');
    } finally {
      setIsSearching(false);
    }
  };

  // Arama temizleme
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchPagination({
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false
    });
  };

  const loadData = async () => {
    try {
      const [invoicesRes, upcomingRes, overdueRes, customersRes, servicesRes] = await Promise.all([
        invoiceService.getAll(),
        invoiceService.getUpcoming(),
        invoiceService.getOverdue(),
        customerService.getAll(),
        serviceService.getAll()
      ]);

      const invoicesData = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : [];
      const upcomingData = Array.isArray(upcomingRes.data?.data) ? upcomingRes.data.data : [];
      const overdueData = Array.isArray(overdueRes.data?.data) ? overdueRes.data.data : [];
      const customersData = Array.isArray(customersRes.data?.data?.items)
        ? customersRes.data.data.items
        : Array.isArray(customersRes.data?.data)
        ? customersRes.data.data
        : Array.isArray(customersRes.data)
        ? customersRes.data
        : [];
      const servicesData = Array.isArray(servicesRes.data?.data?.items)
        ? servicesRes.data.data.items
        : Array.isArray(servicesRes.data?.data)
        ? servicesRes.data.data
        : Array.isArray(servicesRes.data)
        ? servicesRes.data
        : [];

      console.log('Sample invoice data:', invoicesData[0]);
      console.log('Invoice statuses:', invoicesData.map(inv => ({ id: inv.id, status: inv.status })));
      
      setInvoices(invoicesData);
      setUpcomingInvoices(upcomingData);
      setOverdueInvoices(overdueData);
      setCustomers(customersData);
      setServices(servicesData);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setInvoices([]);
      setUpcomingInvoices([]);
      setOverdueInvoices([]);
      setCustomers([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemsPayload = formData.items.map(item => ({
        id: item.id,
        serviceId: Number(item.serviceId),
        renewalCycle: item.renewalCycle,
        price: Number(item.price),
        quantity: Number(item.quantity),
        vat: Number(item.vat), // küçük harf
        startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
        description: item.description || ''
      }));

      const payload = {
        customerId: Number(formData.customerId),
        description: formData.description || '',
        items: itemsPayload
      };

      if (editingInvoice) {
        payload.id = editingInvoice.id;
        payload.status = formData.status; // FormData'dan status al
        await invoiceService.update(payload);
      } else {
        await invoiceService.create(payload);
      }

      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Fatura kaydedilirken hata:', error);
      console.error('Hata detayı:', error.response?.data);
      console.error('Hata durumu:', error.response?.status);
    }
  };

  const handleEdit = async (invoice) => {
    try {
      // GET /api/invoices/{id} ile mevcut fatura bilgilerini getir
      const response = await invoiceService.getById(invoice.id);
      const invoiceData = response.data?.data || response.data;
      
      setEditingInvoice(invoiceData);
      setFormData({
        customerId: invoiceData.customerId,
        description: invoiceData.description,
        status: invoiceData.status || 'Pending',
        items: invoiceData.items?.map(i => ({
          id: i.id,
          serviceId: i.serviceId,
          renewalCycle: i.renewalCycle,
          price: i.price,
          quantity: i.quantity,
          vat: i.vat,
          startDate: i.startDate ? new Date(i.startDate).toISOString().split('T')[0] : '',
          description: i.description
        })) || [{ serviceId: '', renewalCycle: 'None', price: '', quantity: 1, description: '', vat: 18, startDate: '' }]
      });
      setShowModal(true);
    } catch (error) {
      console.error('Fatura bilgileri yüklenirken hata:', error);
      alert('Fatura bilgileri yüklenirken hata oluştu!');
    }
  };

  const handleDelete = async (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    const invoiceInfo = invoice ? `${invoice.customerName} - ₺${invoice.totalAmount}` : 'Bu fatura';
    
    toast.warning(
      <div>
        <div className="font-semibold mb-2">⚠️ Fatura Silme Uyarısı</div>
        <div className="text-sm">
          <p className="mb-1"><strong>{invoiceInfo}</strong> faturasını silmek istediğinizden emin misiniz?</p>
          <p className="text-red-600 font-medium">Kural 15: Ödenmiş faturalar silinemez!</p>
          <p className="text-gray-600 text-xs mt-1">Sadece bekleyen, gecikmiş veya iptal edilmiş faturalar silinebilir.</p>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: 8000,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          color: '#92400e',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxWidth: '400px'
        }
      }
    );

    // Kullanıcıya onay seçenekleri sun
    setTimeout(() => {
      if (window.confirm(`${invoiceInfo} faturasını silmek istediğinizden emin misiniz?\n\n⚠️ Kural 15: Ödenmiş faturalar silinemez!`)) {
        performDelete(id);
      }
    }, 1000);
  };

  const performDelete = async (id) => {
    try {
      await invoiceService.delete(id);
      loadData();
      toast.success(
        <div>
          <div className="font-semibold">✅ Başarılı!</div>
          <div className="text-sm">Fatura başarıyla silindi.</div>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          style: {
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            color: '#065f46',
            border: '1px solid #10b981',
            borderRadius: '12px'
          }
        }
      );
    } catch (error) {
      console.error('Fatura silinirken hata:', error);
      if (error.response?.data?.message?.includes('ödenmiş') || error.response?.data?.message?.includes('paid')) {
        toast.error(
          <div>
            <div className="font-semibold">❌ Silme İşlemi Başarısız!</div>
            <div className="text-sm">
              <p className="mb-1">Kural 15: Ödenmiş faturalar silinemez.</p>
              <p className="text-xs">Sadece bekleyen, gecikmiş veya iptal edilmiş faturalar silinebilir.</p>
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: 6000,
            style: {
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#991b1b',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '400px'
            }
          }
        );
      } else {
        toast.error(
          <div>
            <div className="font-semibold">❌ Hata!</div>
            <div className="text-sm">Fatura silinirken hata oluştu!</div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000
          }
        );
      }
    }
  };

  const handleMarkAsPaid = async (id) => {
    const invoice = invoices.find(inv => inv.id === id);
    const invoiceInfo = invoice ? `${invoice.customerName} - ₺${invoice.totalAmount}` : 'Bu fatura';
    
    toast.info(
      <div>
        <div className="font-semibold mb-2">💰 Fatura Ödeme İşlemi</div>
        <div className="text-sm">
          <p className="mb-1"><strong>{invoiceInfo}</strong> faturasını ödenmiş olarak işaretlemek istediğinizden emin misiniz?</p>
          <p className="text-blue-600 font-medium">Kural 14: Sadece bekleyen durumundaki faturalar ödenmiş olarak işaretlenebilir!</p>
          <p className="text-gray-600 text-xs mt-1">Ödenmiş, gecikmiş veya iptal edilmiş faturalar tekrar ödenemez.</p>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: 8000,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          color: '#1e40af',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxWidth: '400px'
        }
      }
    );

    // Kullanıcıya onay seçenekleri sun
    setTimeout(() => {
      if (window.confirm(`${invoiceInfo} faturasını ödenmiş olarak işaretlemek istediğinizden emin misiniz?\n\n⚠️ Kural 14: Sadece bekleyen durumundaki faturalar ödenmiş olarak işaretlenebilir!`)) {
        performMarkAsPaid(id);
      }
    }, 1000);
  };

  const performMarkAsPaid = async (id) => {
    try {
      await invoiceService.markAsPaid(id);
      loadData();
      toast.success(
        <div>
          <div className="font-semibold">✅ Başarılı!</div>
          <div className="text-sm">Fatura ödenmiş olarak işaretlendi.</div>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          style: {
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            color: '#065f46',
            border: '1px solid #10b981',
            borderRadius: '12px'
          }
        }
      );
    } catch (error) {
      console.error('Fatura ödeme işaretlenirken hata:', error);
      if (error.response?.data?.message?.includes('bekleyen') || error.response?.data?.message?.includes('pending')) {
        toast.error(
          <div>
            <div className="font-semibold">❌ Ödeme İşlemi Başarısız!</div>
            <div className="text-sm">
              <p className="mb-1">Kural 14: Sadece bekleyen durumundaki faturalar ödenmiş olarak işaretlenebilir.</p>
              <p className="text-xs">Ödenmiş, gecikmiş veya iptal edilmiş faturalar tekrar ödenemez.</p>
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: 6000,
            style: {
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#991b1b',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '400px'
            }
          }
        );
      } else {
        toast.error(
          <div>
            <div className="font-semibold">❌ Hata!</div>
            <div className="text-sm">Fatura ödeme işaretlenirken hata oluştu!</div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000
          }
        );
      }
    }
  };


  const handleProcessRenewals = async () => {
    toast.info(
      <div>
        <div className="font-semibold mb-2">🔄 Yenileme İşlemleri</div>
        <div className="text-sm">
          <p className="mb-2">Yenileme işlemlerini başlatmak istediğinizden emin misiniz?</p>
          <div className="bg-blue-50 p-2 rounded text-xs">
            <p className="font-medium text-blue-800 mb-1">⚠️ Yenileme Kuralları:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Kural 21: Vade tarihi geçmiş olmalı</li>
              <li>Kural 21: Orijinal fatura ödenmiş olmalı</li>
              <li>Kural 21: Hizmet tek seferlik olmamalı</li>
              <li>Kural 22: Vade tarihi otomatik hesaplanır</li>
            </ul>
          </div>
          <p className="text-orange-600 font-medium mt-2">Bu işlem Admin yetkisi gerektirir.</p>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: 10000,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          color: '#0c4a6e',
          border: '1px solid #0284c7',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxWidth: '450px'
        }
      }
    );

    // Kullanıcıya onay seçenekleri sun
    setTimeout(() => {
      if (window.confirm('Yenileme işlemlerini başlatmak istediğinizden emin misiniz?\n\n⚠️ Yenileme Kuralları:\n• Kural 21: Vade tarihi geçmiş olmalı\n• Kural 21: Orijinal fatura ödenmiş olmalı\n• Kural 21: Hizmet tek seferlik olmamalı\n• Kural 22: Vade tarihi otomatik hesaplanır\n\nBu işlem Admin yetkisi gerektirir.')) {
        performRenewals();
      }
    }, 1000);
  };

  const performRenewals = async () => {
    try {
      setProcessingRenewals(true);
      const response = await invoiceService.processRenewals();
      
      if (response.data?.success || response.data?.isSuccess) {
        toast.success(
          <div>
            <div className="font-semibold">✅ Yenileme İşlemleri Tamamlandı!</div>
            <div className="text-sm">
              <p className="mb-1">Yenileme işlemleri başarıyla tamamlandı.</p>
              <p className="text-green-600 font-medium">Kural 22: Vade tarihleri yenileme döngüsüne göre otomatik hesaplandı.</p>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            style: {
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              color: '#065f46',
              border: '1px solid #10b981',
              borderRadius: '12px'
            }
          }
        );
      } else {
        toast.info(
          <div>
            <div className="font-semibold">ℹ️ Yenileme İşlemleri</div>
            <div className="text-sm">Yenileme işlemleri tamamlandı.</div>
          </div>,
          {
            position: "top-right",
            autoClose: 3000
          }
        );
      }
      loadData();
    } catch (error) {
      console.error('Yenileme işlemleri sırasında hata:', error);
      toast.error(
        <div>
          <div className="font-semibold">❌ Hata!</div>
          <div className="text-sm">Yenileme işlemleri sırasında hata oluştu!</div>
        </div>,
        {
          position: "top-right",
          autoClose: 4000
        }
      );
    } finally {
      setProcessingRenewals(false);
    }
  };

  const handleViewDetails = async (invoiceId) => {
    try {
      const response = await invoiceService.getById(invoiceId);
      setSelectedInvoice(response.data?.data || response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Fatura detayları yüklenirken hata:', error);
      alert('Fatura detayları yüklenirken hata oluştu!');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { serviceId: '', renewalCycle: 'None', price: '', quantity: 1, description: '', vat: 18, startDate: '' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = async (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Eğer hizmet seçildiyse fiyatı otomatik getir
    if (field === 'serviceId' && value) {
      try {
        const response = await invoiceService.getServicePrice(value);
        if (response.data?.data?.price) {
          newItems[index].price = response.data.data.price;
        }
      } catch (error) {
        console.error('Hizmet fiyatı getirilirken hata:', error);
      }
    }
    
    // Eğer renewal cycle değiştirildiyse fiyatı güncelle
    if (field === 'renewalCycle') {
      const currentPrice = parseFloat(newItems[index].price) || 0;
      if (value === 'Yearly' && currentPrice > 0) {
        // Yıllık için 12 ay fiyatı (aylık fiyatı 12 ile çarp)
        newItems[index].price = (currentPrice * 12).toString();
      } else if (value === 'Monthly' && currentPrice > 0) {
        // Aylık için fiyatı olduğu gibi bırak (zaten aylık fiyat)
        newItems[index].price = currentPrice.toString();
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      description: '',
      status: 'Pending',
      items: [{ serviceId: '', renewalCycle: 'None', price: '', quantity: 1, description: '', vat: 18, startDate: '' }]
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.fullName}` : '';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Bilinmeyen Hizmet';
  };

  const getCurrentInvoices = () => {
    // Eğer arama yapılıyorsa arama sonuçlarını döndür
    if (searchTerm.trim() && searchResults.length > 0) {
      return searchResults;
    }
    
    switch (activeTab) {
      case 'upcoming':
        return upcomingInvoices;
      case 'overdue':
        return overdueInvoices;
      case 'renewals':
        return invoices.filter(invoice => invoice.isRenewal);
      default:
        return invoices;
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Faturalar</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {canCreate() && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
            >
              Yeni Fatura Ekle
            </button>
          )}
          <button
            onClick={handleProcessRenewals}
            disabled={processingRenewals}
            className={`px-4 py-2 rounded-lg ${
              processingRenewals 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-black hover:bg-blue-700'
            }`}
            title="Yenileme işlemlerini başlat (Admin only)"
          >
            {processingRenewals ? 'İşleniyor...' : 'Yenileme İşlemleri'}
          </button>
        </div>
      </div>

      {/* Yenileme Sistemi Bilgisi */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Yenileme Sistemi</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Vade tarihi geçmiş ödenmiş faturalar yenilenebilir ve yenilenmiş fatura olarak geçer.</p>
              <p className="mt-1">Yenileme işlemi için "Yenileme İşlemleri" butonunu kullanın.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Arama Kutusu */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri Adı ile Arama
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Müşteri adı girin..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSearching}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  disabled={isSearching}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !searchTerm.trim()}
              className={`px-4 py-2 rounded-lg ${
                isSearching || !searchTerm.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-black hover:bg-blue-700'
              }`}
            >
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </button>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-500 text-black rounded-lg hover:bg-gray-600"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
        
        {/* Arama Sonuçları Bilgisi */}
        {searchTerm.trim() && (
          <div className="mt-3 text-sm text-gray-600">
            {isSearching ? (
              <span>Arama yapılıyor...</span>
            ) : searchResults.length > 0 ? (
              <span>
                "{searchTerm}" için {searchPagination.totalCount} sonuç bulundu
                {searchPagination.totalPages > 1 && (
                  <span> (Sayfa {searchPagination.pageNumber}/{searchPagination.totalPages})</span>
                )}
              </span>
            ) : (
              <span>"{searchTerm}" için sonuç bulunamadı</span>
            )}
          </div>
        )}
      </div>


      {/* Sekmeler */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 px-4 md:px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tüm Faturalar ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Yaklaşan Faturalar ({upcomingInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overdue'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gecikmiş Faturalar ({overdueInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('renewals')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'renewals'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔄 Yenilenmiş Faturalar ({invoices.filter(invoice => invoice.isRenewal).length})
            </button>
          </nav>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Tutar</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Vade Tarihi</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentInvoices().map((invoice) => {
                // Debug: Backend'den gelen durumu logla
                console.log(`Invoice ${invoice.id}: Backend status = ${invoice.status}, Items:`, invoice.items?.map(item => ({ 
                  dueDate: item.dueDate, 
                  isOverdue: item.dueDate && item.dueDate !== '0001-01-01T00:00:00' && new Date(item.dueDate) < new Date() 
                })));
                
                // Durum hesaplama mantığı - Backend'den gelen status'u direkt kullan
                let displayStatus = invoice.status;
                let statusColor = 'bg-yellow-100 text-yellow-800';
                let statusText = 'Bekliyor';
                
                if (invoice.status === 'Paid') {
                  statusColor = 'bg-green-100 text-green-800';
                  statusText = 'Ödendi';
                } else if (invoice.status === 'Cancelled') {
                  statusColor = 'bg-gray-100 text-gray-800';
                  statusText = 'İptal';
                } else if (invoice.status === 'Overdue') {
                  statusColor = 'bg-red-100 text-red-800';
                  statusText = 'Gecikmiş';
                } else {
                  // Pending durumu
                  statusColor = 'bg-yellow-100 text-yellow-800';
                  statusText = 'Bekliyor';
                }
                
                return (
                <tr key={invoice.id}>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {invoice.isRenewal && <span className="mr-2" title="Bu fatura yenilenmiştir">🔄</span>}
                      {getCustomerName(invoice.customerId)}
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₺{invoice.totalAmount}</td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                    {invoice.dueDate && invoice.dueDate !== '0001-01-01T00:00:00' 
                      ? new Date(invoice.dueDate).toLocaleDateString('tr-TR') 
                      : '-'}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                      <button onClick={() => handleViewDetails(invoice.id)} className="text-purple-600 hover:text-purple-900 text-xs sm:text-sm">Detay</button>
                      {canUpdate() && <button onClick={() => handleEdit(invoice)} className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm">Düzenle</button>}
                      {canDelete() && <button onClick={() => handleDelete(invoice.id)} className="text-red-600 hover:text-red-900 text-xs sm:text-sm">Sil</button>}
                      {displayStatus !== 'Paid' && canUpdate() && (
                        <button onClick={() => handleMarkAsPaid(invoice.id)} className="text-green-600 hover:text-green-900 text-xs sm:text-sm">
                          Ödendi
                        </button>
                      )}
                      {!canUpdate() && !canDelete() && <span className="text-gray-400 text-xs sm:text-sm">Sadece görüntüleme</span>}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Sayfalama - Sadece arama sonuçları için */}
        {searchTerm.trim() && searchPagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleSearch(searchPagination.pageNumber - 1)}
                disabled={!searchPagination.hasPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  !searchPagination.hasPreviousPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Önceki
              </button>
              <button
                onClick={() => handleSearch(searchPagination.pageNumber + 1)}
                disabled={!searchPagination.hasNextPage}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  !searchPagination.hasNextPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{((searchPagination.pageNumber - 1) * searchPagination.pageSize) + 1}</span>
                  {' - '}
                  <span className="font-medium">
                    {Math.min(searchPagination.pageNumber * searchPagination.pageSize, searchPagination.totalCount)}
                  </span>
                  {' / '}
                  <span className="font-medium">{searchPagination.totalCount}</span>
                  {' sonuçtan'}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handleSearch(searchPagination.pageNumber - 1)}
                    disabled={!searchPagination.hasPreviousPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      !searchPagination.hasPreviousPage
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Önceki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Sayfa numaraları */}
                  {Array.from({ length: Math.min(5, searchPagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, searchPagination.pageNumber - 2);
                    const pageNum = startPage + i;
                    if (pageNum > searchPagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleSearch(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === searchPagination.pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handleSearch(searchPagination.pageNumber + 1)}
                    disabled={!searchPagination.hasNextPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      !searchPagination.hasNextPage
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Sonraki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingInvoice ? 'Fatura Düzenle' : 'Yeni Fatura Ekle'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Müşteri <span className="text-red-500">*</span></label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    required
                  >
                    <option value="">Müşteri Seçin</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Kural 16: Müşteri mevcut ve aktif olmalıdır</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  rows="3"
                />
              </div>

              {/* Status Seçimi - Sadece düzenleme modunda ve admin yetkisi varsa */}
              {editingInvoice && canUpdate() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fatura Durumu</label>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm text-gray-600">Mevcut:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      editingInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      editingInvoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      editingInvoice.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {editingInvoice.status === 'Paid' ? 'Ödendi' :
                       editingInvoice.status === 'Overdue' ? 'Gecikmiş' :
                       editingInvoice.status === 'Cancelled' ? 'İptal' :
                       'Bekliyor'}
                    </span>
                  </div>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  >
                    {invoiceStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    💡 <strong>İpucu:</strong> Pending → Paid sırası önerilir. Overdue otomatik olarak sistem tarafından belirlenir.
                  </p>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Fatura Kalemleri <span className="text-red-500">*</span></label>
                  <button type="button" onClick={addItem} className="px-3 py-1 bg-green-600 text-black rounded text-sm hover:bg-green-700">Kalem Ekle</button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Kural 11: Her fatura en az bir kalem içermelidir</p>

                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hizmet</label>
                        <select
                          value={item.serviceId}
                          onChange={async (e) => await updateItem(index, 'serviceId', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                          required
                        >
                          <option value="">Hizmet Seçin</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name} - ₺{s.price}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yenileme Döngüsü</label>
                        <select
                          value={item.renewalCycle}
                          onChange={(e) => updateItem(index, 'renewalCycle', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                        >
                          <option value="None">Yenileme Yok</option>
                          <option value="Monthly">Aylık</option>
                          <option value="Yearly">Yıllık</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fiyat <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          value={item.price} 
                          onChange={(e) => updateItem(index, 'price', e.target.value)} 
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" 
                          required 
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kural 12: Fiyat sıfırdan büyük olmalıdır</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Adet <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)} 
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" 
                          required 
                          placeholder="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Kural 13: Miktar sıfırdan büyük olmalıdır</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">KDV (%)</label>
                        <input type="number" value={item.vat} onChange={(e) => updateItem(index, 'vat', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                        <input type="date" value={item.startDate} onChange={(e) => updateItem(index, 'startDate', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" required />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" rows="2" />
                    </div>

                    {formData.items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="mt-2 px-3 py-1 bg-red-600 text-black rounded text-sm hover:bg-red-700">Kalemi Sil</button>}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingInvoice(null); resetForm(); }} className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400">İptal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-black rounded hover:bg-blue-700">{editingInvoice ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fatura Detay Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Fatura Detayları</h3>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Fatura Genel Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Fatura Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fatura No:</span>
                    <span className="font-medium text-gray-900">#{selectedInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      selectedInvoice.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoice.status === 'Paid' ? 'Ödendi' :
                       selectedInvoice.status === 'Overdue' ? 'Gecikmiş' :
                       selectedInvoice.status === 'Cancelled' ? 'İptal' :
                       'Bekliyor'}
                    </span>
                  </div>
                  {selectedInvoice.isRenewal && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yenileme:</span>
                      <span className="flex items-center text-green-600 font-medium">
                        <span className="mr-1">🔄</span>
                        Yenilenmiş Fatura
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Tutar:</span>
                    <span className="font-bold text-gray-900">₺{selectedInvoice.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oluşturulma:</span>
                    <span className="text-gray-900">{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium text-gray-900">{getCustomerName(selectedInvoice.customerId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="text-gray-900">{selectedInvoice.description || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fatura Kalemleri */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Fatura Kalemleri</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Döngü</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Fiyat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KDV (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ara Toplam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vade Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items?.map((item, index) => {
                      const subtotal = (item.price * item.quantity) * (1 + item.vat / 100);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{getServiceName(item.serviceId)}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.renewalCycle === 'Monthly' ? 'Aylık' : 
                               item.renewalCycle === 'Yearly' ? 'Yıllık' : 
                               'Yenileme Yok'}
                            </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₺{item.price}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">%{item.vat}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₺{subtotal.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.dueDate && item.dueDate !== '0001-01-01T00:00:00' 
                              ? new Date(item.dueDate).toLocaleDateString('tr-TR') 
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Özet */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Toplam Tutar:</span>
                <span className="text-2xl font-bold text-blue-600">₺{selectedInvoice.totalAmount}</span>
              </div>
            </div>

            {/* Modal Kapatma Butonu */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                className="px-6 py-2 bg-gray-600 text-black rounded-md hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
