import { useEffect, useState } from 'react';
import {
  getBranches,
  getAvailableBranchDaysAndSlotes,
  createReservation,
} from '../services/restaurantService';
import { getErrorMessage } from '../services/api';
import { formatDayDate, formatTimeSlot } from '../utils/formatters';

const Reservation = () => {
  const [formStatus, setFormStatus] = useState('idle'); // 'idle', 'processing', 'success'
  const [error, setError] = useState('');

  const [branches, setBranches] = useState([]);
  const [branchesError, setBranchesError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [branchId, setBranchId] = useState('');
  const [days, setDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // Load branches on mount
  useEffect(() => {
    getBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => setBranchesError(getErrorMessage(err)));
  }, []);

  // Load available days & slots when a branch is selected
  useEffect(() => {
    if (!branchId) return;
    setDaysLoading(true);
    setDaysError('');
    setSelectedDayId('');
    setSelectedSlotId('');
    getAvailableBranchDaysAndSlotes(branchId)
      .then((res) => {
        setDays(res.data || []);
        if (res.data?.length > 0) setSelectedDayId(res.data[0].id);
      })
      .catch((err) => setDaysError(getErrorMessage(err)))
      .finally(() => setDaysLoading(false));
  }, [branchId]);

  const selectedDay = days.find((day) => day.id === selectedDayId);
  const availableSlots = (selectedDay?.daySlots || []).filter(
    (slot) => slot.isAvailable,
  );

  // Reset the slot whenever the day changes
  useEffect(() => {
    setSelectedSlotId('');
  }, [selectedDayId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!branchId) {
      setError('Please select a branch.');
      return;
    }
    if (!selectedDayId) {
      setError('Please select an available day.');
      return;
    }
    if (!selectedSlotId) {
      setError('Please select an available time slot.');
      return;
    }

    setFormStatus('processing');

    const payload = {
      firstName,
      lastName,
      phoneNumber,
      email: email.trim() || undefined,
      numberOfPeople: Number(numberOfPeople),
      branchId: Number(branchId),
      dayId: Number(selectedDayId),
      daySlotId: Number(selectedSlotId),
      note: note.trim() || undefined,
    };

    try {
      await createReservation(payload);
      setFormStatus('success');

      // Reset only the personal fields; keep the branch selected so availability
      // can be refreshed and the just-booked slot no longer shows as available.
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setEmail('');
      setNote('');
      setNumberOfPeople('');
      setSelectedSlotId('');

      setDaysLoading(true);
      setDaysError('');
      getAvailableBranchDaysAndSlotes(branchId)
        .then((res) => {
          setDays(res.data || []);
          if (res.data?.length > 0) setSelectedDayId(res.data[0].id);
        })
        .catch((err) => setDaysError(getErrorMessage(err)))
        .finally(() => setDaysLoading(false));

      setTimeout(() => setFormStatus('idle'), 4000);
    } catch (err) {
      setFormStatus('idle');
      setError(getErrorMessage(err));
    }
  };

  // Shared classes for all inputs to ensure consistency
  const inputClasses = "w-full bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder-gray-400 font-medium text-sm tracking-wide shadow-sm";

  return (
    <div dir="ltr" className="flex flex-col lg:flex-row w-full min-h-screen bg-gray-50 font-sans">
      
      {/* Left Side: Hero Image */}
      <div
        className="w-full lg:w-1/2 h-[30vh] sm:h-[40vh] lg:h-auto bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop')"
        }}
      >
        <div className="w-full h-full bg-black/10"></div>
      </div>

      {/* Right Side: Reservation Form */}
      <div className="w-full lg:w-1/2 flex justify-center py-10 sm:py-12 lg:py-20 px-5 sm:px-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="mb-8 sm:mb-10 text-center lg:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-wide">Make a Reservation</h1>
            <p className="text-gray-500 leading-relaxed">
              Select your preferred branch, day, and time slot and we will confirm your reservation.
            </p>
          </div>

          {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8" autoComplete="on">
            
            {/* Section 1: Personal Information */}
            <div>
              <h2 className="font-serif text-2xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="First Name" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} />
                <input type="text" placeholder="Last Name" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} />
              </div>
              <div className="space-y-4">
                <input type="tel" placeholder="Phone Number" required autoComplete="tel" inputMode="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClasses} />
                <input type="email" placeholder="Email Address" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
              </div>
            </div>

            {/* Section 2: Reservation Details */}
            <div>
              <h2 className="font-serif text-2xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">Details</h2>
              <div className="space-y-4">
                {branchesError ? (
                  <p className="text-sm text-red-500">{branchesError}</p>
                ) : (
                  <select
                    required
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className={`${inputClasses} cursor-pointer invalid:text-gray-400 valid:text-gray-900`}
                  >
                    <option value="" disabled>Select restaurant</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.location}</option>
                    ))}
                  </select>
                )}

                <select required className={`${inputClasses} cursor-pointer invalid:text-gray-400 valid:text-gray-900`} value={numberOfPeople} onChange={(e) => setNumberOfPeople(e.target.value)}>
                  <option value="" disabled>Select party size</option>
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="5">5+ People</option>
                </select>

                {daysError ? (
                  <p className="text-sm text-red-500">{daysError}</p>
                ) : (
                  <select
                    required
                    disabled={!branchId || daysLoading}
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value ? Number(e.target.value) : '')}
                    className={`${inputClasses} cursor-pointer invalid:text-gray-400 valid:text-gray-900 disabled:cursor-not-allowed`}
                  >
                    <option value="" disabled>
                      {!branchId
                        ? 'Select restaurant first'
                        : daysLoading
                          ? 'Loading available days...'
                          : days.length === 0
                            ? 'No available days'
                            : 'Select available day'}
                    </option>
                    {days.map((day) => (
                      <option key={day.id} value={day.id}>{formatDayDate(day.date)}</option>
                    ))}
                  </select>
                )}

                <select
                  required
                  disabled={!selectedDayId || daysLoading}
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : '')}
                  className={`${inputClasses} cursor-pointer invalid:text-gray-400 valid:text-gray-900 disabled:cursor-not-allowed`}
                >
                  <option value="" disabled>
                    {!selectedDayId
                      ? 'Select a day first'
                      : availableSlots.length === 0
                        ? 'No available time slots'
                        : 'Select desired time'}
                  </option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>{formatTimeSlot(slot.time)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3: Note */}
            <div>
              <h2 className="font-serif text-2xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">Leave a Note</h2>
              <textarea 
                placeholder="Message (Allergies, Special Occasions, etc.)" 
                rows="4" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`${inputClasses} resize-none`}
              ></textarea>
            </div>

            {/* Success Message */}
            {formStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-sm">
                Reservation created successfully.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={formStatus !== 'idle'}
              className={`w-full py-4 rounded-sm font-serif font-bold text-lg tracking-widest shadow-md transform transition-all duration-300 flex items-center justify-center gap-2
                ${formStatus === 'idle' ? 'bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-0.5' : ''}
                ${formStatus === 'processing' ? 'bg-amber-600/70 text-white cursor-not-allowed' : ''}
                ${formStatus === 'success' ? 'bg-green-600 text-white' : ''}
              `}
            >
              {formStatus === 'idle' && 'RESERVE'}
              
              {formStatus === 'processing' && (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSING...
                </>
              )}
              
              {formStatus === 'success' && (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  RESERVATION CONFIRMED
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Reservation;
