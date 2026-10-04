import { useEffect, useMemo, useState } from 'react';
import {
  getBranches,
  getAvailableBranchDaysAndSlotes,
  getBranchOpenHours,
} from '../services/restaurantService';
import { getErrorMessage } from '../services/api';
import { formatDayDate, formatTimeSlot } from '../utils/formatters';

const branchImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=2070&auto=format&fit=crop',
];

// Monday -> Sunday Display Order (JS getDay(): Sunday=0)
const WEEK_DAYS = [
  { idx: 1, name: 'Monday' },
  { idx: 2, name: 'Tuesday' },
  { idx: 3, name: 'Wednesday' },
  { idx: 4, name: 'Thursday' },
  { idx: 5, name: 'Friday' },
  { idx: 6, name: 'Saturday' },
  { idx: 0, name: 'Sunday' },
];

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [days, setDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState('');
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [openHours, setOpenHours] = useState([]);
  const [openHoursLoading, setOpenHoursLoading] = useState(false);
  const [openHoursError, setOpenHoursError] = useState('');

  useEffect(() => {
    getBranches()
      .then((res) => {
        const list = res.data || [];
        setBranches(list);
        if (list.length > 0) setActiveBranchId(list[0].id);
      })
      .catch((err) => setBranchesError(getErrorMessage(err)))
      .finally(() => setBranchesLoading(false));
  }, []);

  useEffect(() => {
    if (!activeBranchId) return;
    setDaysLoading(true);
    setDaysError('');
    setSelectedDayId(null);
    getAvailableBranchDaysAndSlotes(activeBranchId)
      .then((res) => {
        const list = res.data || [];
        setDays(list);
        if (list.length > 0) setSelectedDayId(list[0].id);
      })
      .catch((err) => setDaysError(getErrorMessage(err)))
      .finally(() => setDaysLoading(false));
  }, [activeBranchId]);

  useEffect(() => {
    if (!activeBranchId) return;
    setOpenHoursLoading(true);
    setOpenHoursError('');
    getBranchOpenHours(activeBranchId, { openOnly: true })
      .then((res) => setOpenHours(res.data || []))
      .catch((err) => setOpenHoursError(getErrorMessage(err)))
      .finally(() => setOpenHoursLoading(false));
  }, [activeBranchId]);

  // Build A Weekly Schedule (Mon -> Sun) From The Branch's Open Days,
  // Merging Duplicate Time Ranges So It Mirrors What The Admin Configured.
  const weeklySchedule = useMemo(() => {
    const byWeekday = new Map();
    openHours.forEach((item) => {
      if (!item.dayDate) return;
      const parsed = new Date(item.dayDate);
      if (Number.isNaN(parsed.getTime())) return;
      const idx = parsed.getDay();
      if (!byWeekday.has(idx)) byWeekday.set(idx, new Map());
      const ranges = byWeekday.get(idx);
      const key = `${String(item.startTime).slice(0, 5)}-${String(item.endTime).slice(0, 5)}`;
      ranges.set(key, { start: item.startTime, end: item.endTime });
    });
    return WEEK_DAYS.map(({ idx, name }) => ({
      name,
      isToday: idx === new Date().getDay(),
      ranges: [...(byWeekday.get(idx)?.values() || [])].sort((a, b) =>
        String(a.start).localeCompare(String(b.start)),
      ),
    }));
  }, [openHours]);

  const hasAnyHours = weeklySchedule.some((day) => day.ranges.length > 0);

  const activeBranch = branches.find((branch) => branch.id === activeBranchId);
  const selectedDay = days.find((day) => day.id === selectedDayId);
  const availableSlots = (selectedDay?.daySlots || []).filter(
    (slot) => slot.isAvailable,
  );

  const mapSrc =
    activeBranch && activeBranch.latitude && activeBranch.longitude
      ? `https://maps.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}&z=15&output=embed`
      : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110502.61185043564!2d31.24967!3d30.04442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60b21beeb%3A0x79dfb296e8423bba!2sCairo%2C%20Cairo%20Governorate%2C%20Egypt!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus';

  return (
    <div dir="ltr" className="w-full bg-gray-50 flex flex-col font-sans min-h-screen">

      {/* Header Section */}
      <div
        className="relative text-white pt-32 pb-16 md:pt-40 md:pb-20 text-center bg-cover bg-center bg-no-repeat border-b border-amber-500/20"
        style={{
          backgroundImage: "linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.95)), url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop')"
        }}
      >
        <div className="relative z-10">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide drop-shadow-md">Our Locations</h1>
          <p className="text-amber-500 text-xs tracking-[0.3em] mt-4 font-medium uppercase">Find us across Cairo</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-16">

        {/* Page Title & Intro */}
        <div className="text-center md:text-left mb-10">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">Visit a Branch</h2>
          <p className="mt-3 text-gray-500 max-w-2xl leading-relaxed">
            Find your nearest premium dining experience. We are located in the heart of Cairo&apos;s most vibrant neighborhoods.
          </p>
        </div>

        {branchesError ? (
          <div className="text-center text-red-500 text-sm py-10">
            {branchesError}
          </div>
        ) : branchesLoading ? (
          <div className="text-center text-gray-500 text-sm py-10">
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-10">
            No restaurant branches are available yet. The restaurant is currently under establishment.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start">

            {/* Left Side: Branches List (Scrollable) */}
            <div
              className="w-full lg:w-7/12 flex flex-col gap-5 lg:max-h-[640px] lg:overflow-y-auto lg:pr-3 pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >

              {branches.map((branch, index) => (
                <div
                  key={branch.id}
                  onClick={() => setActiveBranchId(branch.id)}
                  className={`group shrink-0 cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row border
                    ${activeBranchId === branch.id
                      ? 'border-amber-500 shadow-lg ring-1 ring-amber-500/30'
                      : 'border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200'
                    }
                  `}
                >
                  {/* Branch Image */}
                  <div className="sm:w-44 w-full h-36 sm:h-auto sm:min-h-[160px] flex-shrink-0 relative overflow-hidden">
                    <img
                      src={branchImages[index % branchImages.length]}
                      alt={branch.location}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700
                        ${activeBranchId === branch.id ? 'scale-105' : 'group-hover:scale-105'}
                      `}
                    />
                    {activeBranchId === branch.id && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-md">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Branch Content */}
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <h3 className="font-serif text-xl font-bold mb-2.5 text-gray-900">{branch.location}</h3>
                    <ul className="space-y-2 text-sm text-gray-600">

                      {/* Location */}
                      <li className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span className="leading-relaxed">{branch.location}</span>
                      </li>

                      {/* Phone */}
                      <li className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <span className="font-bold text-gray-900 tracking-wide">{branch.phone}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Interactive Map (Compact & Sticky) */}
            <div className="w-full lg:w-5/12">
              <div className="lg:sticky lg:top-28">

                {/* Map */}
                <div className="relative h-[320px] sm:h-[400px] lg:h-[440px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-200">

                  <iframe
                    title="Restaurant Locations Map"
                    src={mapSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'contrast(1.05) opacity(0.95)' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>

                  {/* Directions Button */}
                  {activeBranch && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeBranch.latitude},${activeBranch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 hover:bg-amber-500 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-widest shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                      GET DIRECTIONS
                    </a>
                  )}
                </div>

                {/* Active Branch Info Bar */}
                {activeBranch && (
                  <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Selected Branch</p>
                      <p className="font-serif text-lg font-bold text-gray-900 truncate">{activeBranch.location}</p>
                    </div>
                    <a
                      href={`tel:${activeBranch.phone}`}
                      className="shrink-0 inline-flex items-center gap-2 border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white text-xs font-bold tracking-widest px-4 py-2.5 rounded-sm transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      CALL
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Available Days & Time Slots Section */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 tracking-wide">
            Available Days & Time Slots
          </h2>

          {daysError ? (
            <div className="text-center text-red-500 text-sm py-10">{daysError}</div>
          ) : daysLoading ? (
            <div className="text-center text-gray-500 text-sm tracking-widest py-10">LOADING...</div>
          ) : days.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10">
              No available days for this branch right now. Please check back later.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
              {/* Available Days */}
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-5 border-b border-gray-200 pb-3">
                Available Days
              </h3>
              <div className="flex flex-wrap gap-3 mb-10">
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`px-5 py-2.5 rounded-sm text-sm font-medium tracking-wider border transition-colors
                      ${selectedDayId === day.id
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-500'
                      }`}
                  >
                    {formatDayDate(day.date)}
                  </button>
                ))}
              </div>

              {/* Available Time Slots */}
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-5 border-b border-gray-200 pb-3">
                Available Time Slots
              </h3>
              {availableSlots.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  No available time slots for this day. Please select another day.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {availableSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="px-5 py-2.5 rounded-sm text-sm font-medium tracking-wider bg-gray-50 border border-gray-200 text-gray-700"
                    >
                      {formatTimeSlot(slot.time)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Open Hours Section */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 tracking-wide">
            Opening Hours
          </h2>

          {openHoursError ? (
            <div className="text-center text-red-500 text-sm py-10">{openHoursError}</div>
          ) : openHoursLoading ? (
            <div className="text-center text-gray-500 text-sm tracking-widest py-10">LOADING...</div>
          ) : !hasAnyHours ? (
            <div className="text-center text-gray-500 text-sm py-10">
              No opening hours have been set for this branch yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {weeklySchedule.map((day) => (
                  <div
                    key={day.name}
                    className={`rounded-xl border p-5 transition-colors ${
                      day.isToday && day.ranges.length > 0
                        ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif font-bold text-lg text-gray-900">{day.name}</h3>
                      {day.isToday && day.ranges.length > 0 && (
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Today
                        </span>
                      )}
                    </div>
                    {day.ranges.length === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Closed
                      </span>
                    ) : (
                      <ul className="space-y-2">
                        {day.ranges.map((range, i) => (
                          <li key={i} className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatTimeSlot(range.start)}</span>
                            <span className="text-gray-300">-</span>
                            <span>{formatTimeSlot(range.end)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Branches;
