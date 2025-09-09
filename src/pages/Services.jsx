import React, { useState, useEffect } from 'react';
import { serviceService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const { canCreate, canUpdate, canDelete } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await serviceService.getAll();
      console.log('Services API response:', response);
      // API response yapısına göre doğru veriyi al
      const servicesData = response.data?.data || response.data || [];
      setServices(servicesData);
    } catch (error) {
      console.error('Hizmetler yüklenirken hata:', error);
      setServices([]); // Hata durumunda boş array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await serviceService.update({ id: editingService.id, ...formData });
      } else {
        await serviceService.create(formData);
      }
      setShowModal(false);
      setEditingService(null);
      resetForm();
      loadServices();
    } catch (error) {
      console.error('Hizmet kaydedilirken hata:', error);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      try {
        await serviceService.delete(id);
        loadServices();
      } catch (error) {
        console.error('Hizmet silinirken hata:', error);
      }
    }
  };

  const handleViewDetails = async (service) => {
    try {
      const response = await serviceService.getById(service.id);
      const serviceData = response.data?.data || response.data;
      setSelectedService(serviceData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Hizmet detayları yüklenirken hata:', error);
      alert('Hizmet detayları yüklenirken hata oluştu!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: ''
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Hizmetler</h1>
        {canCreate() && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
          >
            Yeni Hizmet Ekle
          </button>
        )}
      </div>

      {/* Hizmet Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hizmet Adı
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleViewDetails(service)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                    >
                      {service.name}
                    </button>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₺{service.price}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                      {canUpdate() && (
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                        >
                          Düzenle
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                        >
                          Sil
                        </button>
                      )}
                      {!canUpdate() && !canDelete() && (
                        <span className="text-gray-400 text-xs sm:text-sm">Sadece görüntüleme</span>
                      )}
                    </div>
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
          <div className="relative top-10 mx-auto p-4 md:p-5 border w-11/12 md:w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hizmet Adı <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    required
                    placeholder="Hizmet adı zorunludur"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kural 8: Hizmet adı zorunludur | Kural 10: Hizmet adı benzersiz olmalıdır</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fiyat (₺) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    required
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kural 9: Hizmet fiyatı negatif olamaz (sıfır veya pozitif)</p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingService(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700"
                  >
                    {editingService ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hizmet Detay Modal */}
      {showDetailModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Hizmet Detayları</h3>
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
                <h4 className="font-semibold text-gray-900 mb-3">Hizmet Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hizmet Adı:</span>
                    <span className="font-medium text-gray-900">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fiyat:</span>
                    <span className="font-bold text-gray-900">₺{selectedService.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hizmet ID:</span>
                    <span className="text-gray-900">#{selectedService.id}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Ek Bilgiler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="text-gray-900">{selectedService.description || 'Açıklama bulunmuyor.'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kayıt Tarihi:</span>
                    <span className="text-gray-900">
                      {selectedService.createdAt ? new Date(selectedService.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Güncelleme Tarihi:</span>
                    <span className="text-gray-900">
                      {selectedService.updatedAt ? new Date(selectedService.updatedAt).toLocaleDateString('tr-TR') : '-'}
                    </span>
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

export default Services;
