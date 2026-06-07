import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Filter, Calendar, MapPin } from 'lucide-react';

export default function DashboardView({ onSelectCustomer, refreshTrigger }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const data = await api.getCustomers();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (err) {
        setError('Unable to parse active customer registers. Verify backend server logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDirectoryData();
  }, [refreshTrigger]);

  useEffect(() => {
    let result = customers;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) || c.city.toLowerCase().includes(query));
    }
    if (genderFilter !== 'All') result = result.filter(c => c.gender === genderFilter);
    if (statusFilter !== 'All') result = result.filter(c => c.journeyStatus === statusFilter);
    setFilteredCustomers(result);
  }, [searchQuery, genderFilter, statusFilter, customers]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Profile Verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Searching Matches': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Interaction Stage': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Matched': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-sm font-medium text-gray-500">Syncing secure client matrices...</p>
      </div>
    );
  }

  if (error) return <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center max-w-xl mx-auto my-4 mx-4">{error}</div>;

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative w-full lg:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search className="w-4 h-4" /></span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or city..." className="w-full bg-gray-50 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:border-tdc-logo-gold transition-all text-gray-800 placeholder-gray-400" />
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 w-full lg:w-auto items-center justify-end">
          <div className="flex items-center justify-center space-x-2 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
          </div>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="bg-white text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none w-full sm:w-auto cursor-pointer">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none w-full sm:w-auto cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="Profile Verified">Profile Verified</option>
            <option value="Searching Matches">Searching Matches</option>
            <option value="Interaction Stage">Interaction Stage</option>
            <option value="Matched">Matched</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer._id} onClick={() => onSelectCustomer(customer._id)} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-tdc-logo-gold transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group justify-between space-y-4 transform hover:-translate-y-0.5">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h3 className="font-serif text-base sm:text-lg font-bold text-tdc-dark group-hover:text-tdc-logo-gold transition-colors truncate">{customer.firstName} {customer.lastName}</h3>
                <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-400 mt-0.5">
                  <span>{customer.gender}</span><span>•</span><span>{customer.maritalStatus}</span>
                </div>
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${getStatusStyle(customer.journeyStatus)}`}>{customer.journeyStatus}</span>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-3 border-t border-gray-50">
              <div className="flex items-center space-x-2 text-gray-600 min-w-0">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs font-medium truncate">{new Date().getFullYear() - new Date(customer.dateOfBirth).getFullYear()} Yrs Old</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 min-w-0">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs font-medium truncate">{customer.city}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredCustomers.length === 0 && <div className="bg-white py-16 text-center border rounded-2xl text-gray-400 font-medium mx-2 sm:browser-layout">No matches fit specified parameters.</div>}
    </div>
  );
}