import React, { useState, useEffect } from 'react';
import { invoiceService, customerService, serviceService } from '../services/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    items: [{ serviceId: '', renewalCycle: 'monthly', price: '', quantity: 1, description: '', vat: 18, startDate: '', dueDate: '' }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, customersRes, servicesRes] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
        serviceService.getAll()
      ]);
  
      const invoicesData = Array.isArray(invoicesRes.data?.data?.items)
        ? invoicesRes.data.data.items
        : [];
      const customersData = Array.isArray(customersRes.data?.data?.items)
        ? customersRes.data.data.items
        : [];
      const servicesData = Array.isArray(servicesRes.data?.data?.items)
        ? servicesRes.data.data.items
        : [];
  
      setInvoices(invoicesData);
      setCustomers(customersData);
      setServices(servicesData);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      setInvoices([]);
      setCustomers([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await invoiceService.update({ id: editingInvoice.id, ...formData });
      } else {
        await invoiceService.create(formData);
      }
      setShowModal(false);
      setEditingInvoice(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Fatura kaydedilirken hata:', error);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customerId: invoice.customerId,
      description: invoice.description,
      items: invoice.items || [{ serviceId: '', renewalCycle: 'monthly', price: '', quantity: 1, description: '', vat: 18, startDate: '', dueDate: '' }]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu faturayı silmek istediğinizden emin misiniz?')) {
      try {
        await invoiceService.delete(id);
        loadData();
      } catch (error) {
        console.error('Fatura silinirken hata:', error);
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { serviceId: '', renewalCycle: 'monthly', price: '', quantity: 1, description: '', vat: 18, startDate: '', dueDate: '' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      description: '',
      items: [{ serviceId: '', renewalCycle: 'monthly', price: '', quantity: 1, description: '', vat: 18, startDate: '', dueDate: '' }]
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : '';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : '';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Faturalar</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700"
        >
          Yeni Fatura Ekle
        </button>
      </div>

      {/* Fatura Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vade Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getCustomerName(invoice.customerId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₺{invoice.totalAmount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Ödendi' :
                       invoice.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
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
          <div className="relative top-10 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingInvoice ? 'Fatura Düzenle' : 'Yeni Fatura Ekle'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Müşteri</label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Müşteri Seçin</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Fatura Kalemleri</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Kalem Ekle
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hizmet</label>
                          <select
                            value={item.serviceId}
                            onChange={(e) => updateItem(index, 'serviceId', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          >
                            <option value="">Hizmet Seçin</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - ₺{service.price}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Yenileme Döngüsü</label>
                          <select
                            value={item.renewalCycle}
                            onChange={(e) => updateItem(index, 'renewalCycle', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          >
                            <option value="monthly">Aylık</option>
                            <option value="yearly">Yıllık</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Fiyat</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Adet</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">KDV (%)</label>
                          <input
                            type="number"
                            value={item.vat}
                            onChange={(e) => updateItem(index, 'vat', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(e) => updateItem(index, 'startDate', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vade Tarihi</label>
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateItem(index, 'dueDate', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          rows="2"
                        />
                      </div>
                      
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Kalemi Sil
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingInvoice(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingInvoice ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
