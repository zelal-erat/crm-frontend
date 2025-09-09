import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { canCreate, canUpdate, canDelete } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    taxOffice: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      const customersData = Array.isArray(response.data.data.items) ? response.data.data.items : [];
      setCustomers(customersData);
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        // PUT request için id’yi body’e ekle
        await customerService.update(editingCustomer.id, {
          id: editingCustomer.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          taxOffice: formData.taxOffice,
          taxNumber: formData.taxNumber,
          address: formData.address,
          description: formData.description
        });
      } else {
        await customerService.create({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          taxOffice: formData.taxOffice,
          taxNumber: formData.taxNumber,
          address: formData.address,
          description: formData.description
        });
      }
  
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Müşteri kaydedilirken hata:', error);
    }
  };
  

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      taxOffice: customer.taxOffice,
      taxNumber: customer.taxNumber,
      address: customer.address,
      description: customer.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const customer = customers.find(c => c.id === id);
    const customerName = customer ? customer.fullName : 'Bu müşteri';
    
    toast.warning(
      <div>
        <div className="font-semibold mb-2">⚠️ Müşteri Silme Uyarısı</div>
        <div className="text-sm">
          <p className="mb-1"><strong>{customerName}</strong> müşterisini silmek istediğinizden emin misiniz?</p>
          <p className="text-red-600 font-medium">Kural 4: Aktif faturası olan müşteriler silinemez!</p>
          <p className="text-gray-600 text-xs mt-1">Sistemde bekleyen durumda faturası bulunan müşterilerin silinmesi engellenir.</p>
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
      if (window.confirm(`${customerName} müşterisini silmek istediğinizden emin misiniz?\n\n⚠️ Kural 4: Aktif faturası olan müşteriler silinemez!`)) {
        performDelete(id);
      }
    }, 1000);
  };

  const performDelete = async (id) => {
    try {
      await customerService.delete(id);
      loadCustomers();
      toast.success(
        <div>
          <div className="font-semibold">✅ Başarılı!</div>
          <div className="text-sm">Müşteri başarıyla silindi.</div>
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
      console.error('Müşteri silinirken hata:', error);
      if (error.response?.data?.message?.includes('aktif fatura') || error.response?.data?.message?.includes('bekleyen fatura')) {
        toast.error(
          <div>
            <div className="font-semibold">❌ Silme İşlemi Başarısız!</div>
            <div className="text-sm">
              <p className="mb-1">Kural 4: Bu müşterinin aktif/bekleyen faturası bulunmaktadır.</p>
              <p className="text-xs">Önce faturaları iptal edin veya ödenmiş olarak işaretleyin.</p>
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
            <div className="text-sm">Müşteri silinirken hata oluştu!</div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000
          }
        );
      }
    }
  };

  const handleViewDetails = async (customer) => {
    try {
      const response = await customerService.getById(customer.id);
      const customerData = response.data?.data || response.data;
      setSelectedCustomer(customerData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Müşteri detayları yüklenirken hata:', error);
      alert('Müşteri detayları yüklenirken hata oluştu!');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      taxOffice: '',
      taxNumber: '',
      address: '',
      description: ''
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Müşteriler</h1>
        {canCreate() && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
          >
            Yeni Müşteri Ekle
          </button>
        )}
      </div>

      {/* Müşteri Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vergi No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleViewDetails(customer)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                    >
                      {customer.fullName}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.taxNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {canUpdate() && (
                      <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-900 mr-3">Düzenle</button>
                    )}
                    {canDelete() && (
                      <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900">Sil</button>
                    )}
                    {!canUpdate() && !canDelete() && (
                      <span className="text-gray-400 text-sm">Sadece görüntüleme</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ad Soyad <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                    placeholder="Ad Soyad zorunludur"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kural 5: Ad soyad alanı boş bırakılamaz</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-posta <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                    placeholder="ornek@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kural 1: E-posta benzersiz olmalıdır | Kural 6: Geçerli format kontrolü</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                {/* Tax Office & Tax Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vergi Dairesi</label>
                    <input
                      type="text"
                      value={formData.taxOffice}
                      onChange={(e) => setFormData({...formData, taxOffice: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vergi Numarası</label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({...formData, taxNumber: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adres</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingCustomer(null); resetForm(); }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700"
                  >
                    {editingCustomer ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Detay Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Müşteri Detayları</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Kişisel Bilgiler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri ID:</span>
                    <span className="text-gray-900">#{selectedCustomer.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ad Soyad:</span>
                    <span className="font-medium text-gray-900">{selectedCustomer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-posta:</span>
                    <span className="text-gray-900">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="text-gray-900">{selectedCustomer.phone || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Vergi Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vergi Dairesi:</span>
                    <span className="text-gray-900">{selectedCustomer.taxOffice || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vergi Numarası:</span>
                    <span className="text-gray-900">{selectedCustomer.taxNumber || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-3">Adres Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adres:</span>
                    <span className="text-gray-900">{selectedCustomer.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="text-gray-900">{selectedCustomer.description || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-black rounded-md hover:bg-gray-700"
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

export default Customers;
