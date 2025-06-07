// (Updated version of the code with leave request date calendar, validations, weekend/public holiday detection, limits, duration counter)
import React, { useState, useContext, createContext,useEffect,useMemo } from 'react';
import { format, isAfter, differenceInCalendarDays, isWeekend, isBefore } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';



const AuthContext = createContext();
const HolidayContext = createContext();

function getDateClassName(date, appliedDates) {
  const formatted = format(date, 'yyyy-MM-dd');

  const isApplied = appliedDates.includes(formatted);
  const isPH = publicHolidays.includes(formatted);
  const weekend = isWeekend(date);

  if (isApplied) return 'text-black bg-yellow-200 font-semibold';
  if (isPH) return 'bg-orange-200 text-red-700';
  if (weekend) return 'bg-red-100 text-red-500';

  return '';
}

const roles = {
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

const employees = [
  { name: 'Kavya M', team: 'Team A' },
  { name: 'Prashant P', team: 'Team A' },
  { name: 'Arun Kumar', team: 'Team A' },
];

const statusColors = {
  applied: 'bg-yellow-300',
  approved: 'bg-green-400',
  rejected: 'bg-red-400'
};

const publicHolidays = [
  '2025-01-01',
  '2025-08-15',
  '2025-10-02',
];

function App() {
  useEffect(() => {
    // Optional delay to simulate redirect or session expiration
    const timer = setTimeout(() => {
      setUser({ role: '', name: '' });
    }, 100); // Delay slightly to allow first mount
  
    return () => clearTimeout(timer);
  }, []);
  
  // const [user, setUser] = useState({ role: roles.EMPLOYEE, name: '' });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { role: '', name: '' };
  });
  // const [holidays, setHolidays] = useState([]);// will loose the data once 
  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('holidays');
    return saved ? JSON.parse(saved) : [];
  }); // store the data even after refresh


  useEffect(() => {
    localStorage.setItem('holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
  localStorage.setItem('user', JSON.stringify(user));
}, [user]);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <HolidayContext.Provider value={{ holidays, setHolidays }}>
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100">
          <Navbar />
          <main className="flex-grow p-6">
            {!user.name ? <EmployeeSelector /> : user.role === roles.MANAGER ? <ManagerView /> : <EmployeeView />}
          </main>
          <Footer />
        </div>
      </HolidayContext.Provider>
    </AuthContext.Provider>
  );
}

function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wide">Holiday Planner</h1>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-blue-600 text-white text-center py-3 mt-6">
      <p className="text-sm">© {new Date().getFullYear()} Holiday Planner | Designed by Kruthika Sudhakar</p>
    </footer>
  );
}

function Header() {
  const { user, setUser } = useContext(AuthContext);
  if (!user.name) return null;

  return (
    <div className="flex justify-between items-center mb-6 bg-white shadow-md rounded p-4">
      <h2 className="text-xl font-semibold text-blue-700">Welcome, {user.name}!</h2>
      <div>
        <span className="mr-4 text-gray-600">Role: {user.role}</span>
        {user.role === roles.MANAGER ? (
          <select
            className="px-2 py-1 border rounded mr-2"
            onChange={e => setUser({ role: roles.EMPLOYEE, name: e.target.value })}
          >
            <option value="">Switch to Employee</option>
            {employees.map(emp => (
              <option key={emp.name} value={emp.name}>{emp.name}</option>
            ))}
          </select>
        ) : (
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={() => setUser({ role: roles.MANAGER, name: 'Kruthika Sudhakar' })}
          >
            Switch to Manager
          </button>
        )}
      </div>
    </div>
  );
}

function EmployeeSelector() {
  const { setUser } = useContext(AuthContext);

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] bg-white p-10 rounded-lg shadow-xl mx-auto max-w-lg">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Select Employee</h2>
      <select
        className="px-4 py-2 border rounded mb-4 w-full"
        onChange={e => {
          const selected = e.target.value;
          if (selected) {
            setUser({ role: roles.EMPLOYEE, name: selected });
          }
        }}
        defaultValue=""
      >
        <option value="" disabled>Select an employee</option>
        {employees.map(emp => (
          <option key={emp.name} value={emp.name}>{emp.name}</option>
        ))}
      </select>
      <p className="text-sm text-gray-600">Or <button className="text-blue-500 underline hover:text-blue-700" onClick={() => setUser({ role: roles.MANAGER, name: 'Jane Manager' })}>login as Manager</button></p>
    </div>
  );
}

function EmployeeView() {
  const { user } = useContext(AuthContext);
  const { holidays, setHolidays } = useContext(HolidayContext);


const userHolidays = useMemo(() => {
  return holidays.filter(h => h.name === user.name);
}, [holidays, user.name]);
  // const userHolidays = holidays.filter(h => h.name === user.name);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [leaveType, setLeaveType] = useState('Casual');
  const [remarks, setRemarks] = useState(''); 
  const rejectedHolidays = userHolidays.filter(h => h.status === 'rejected');
  const hasRejected = rejectedHolidays.length > 0;
  
  const clearRejectedForEmployee = () => {
    const filtered = holidays.filter(h => !(h.name === user.name && h.status === 'rejected'));
    setHolidays(filtered);
  };
  const approvedHolidays = userHolidays.filter(h => h.status === 'approved');
  const hasApproved = approvedHolidays.length > 0;
  
  const clearApprovedForEmployee = () => {
    const filtered = holidays.filter(h => !(h.name === user.name && h.status === 'approved'));
    setHolidays(filtered);
  };
  const appliedDates = holidays
  .filter(h => h.name === user.name)
  .flatMap(h => {
    const dates = [];
    let current = new Date(h.start);
    while (current <= new Date(h.end)) {
      dates.push(format(new Date(current), 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  });

  
  const totalDaysTaken = userHolidays.reduce((sum, h) => sum + h.duration, 0);

  const applyLeave = () => {
    if (!startDate || !endDate) return alert('Select both start and end dates.');
    if (isAfter(startDate, endDate)) return alert('Start date cannot be after end date.');
    if (isBefore(startDate, new Date()) || isBefore(endDate, new Date())) return alert('Past dates not allowed.');
  
    const selectedDates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      selectedDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  
    const workingDays = selectedDates.filter(date => {
      const formatted = format(date, 'yyyy-MM-dd');
      return !isWeekend(date) && !publicHolidays.includes(formatted);
    });
  
    const duration = workingDays.length;
  
    if (totalDaysTaken + duration > 15) {
      return alert('Exceeds annual 15-day holiday limit.');
    }
  
    const weekendDates = selectedDates.filter(date => isWeekend(date)).map(d => format(d, 'MMM dd')).join(', ');
    const holidayDates = selectedDates.filter(date => publicHolidays.includes(format(date, 'yyyy-MM-dd'))).map(d => format(d, 'MMM dd')).join(', ');
  
    if (weekendDates) alert(`Weekend(s) selected: ${weekendDates}`);
    if (holidayDates) alert(`Public holiday(s) selected: ${holidayDates}`);
  
    setHolidays([...holidays, {
      name: user.name,
      start: startDate,
      end: endDate,
      status: 'applied',
      leaveType,
      remarks,
      duration
    }]);
  
    // Reset form
    setStartDate(null);
    setEndDate(null);
    setLeaveType('Casual');
    setRemarks('');
  };
  

  const cancelRequest = (index) => {
    const updated = [...holidays];
    updated.splice(index, 1);
    setHolidays(updated);
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <Header />
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">Request a Leave</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
            <DatePicker
  selected={startDate}
  onChange={date => setStartDate(date)}
  className="border px-2 py-1 rounded"
  minDate={new Date()}
  highlightDates={publicHolidays.map(date => new Date(date))}
  dayClassName={date => getDateClassName(date, appliedDates)}
/>

          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              className="border px-2 py-1 rounded"
              minDate={startDate || new Date()}
              highlightDates={publicHolidays.map(date => new Date(date))}
             dayClassName={date => getDateClassName(date, appliedDates)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Leave Type</label>
            <select className="border px-2 py-1 rounded" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Earned">Earned</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} className="border px-2 py-1 rounded w-64" placeholder="Optional" />
          </div>
          <button onClick={applyLeave} className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded mt-6">Apply</button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Total Leave Taken: {totalDaysTaken}/15 days</p>
      </div>
  
        <button
  onClick={clearRejectedForEmployee}
  disabled={!hasRejected}
  className={`px-4 py-2 rounded mt-6 text-white ${
    hasRejected ? 'bg-red-600 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'
  }`}
>
  Clear Rejected
</button> &nbsp;
{/*Approved clearance button */}
<button
  onClick={clearApprovedForEmployee}
  disabled={!hasApproved}
  className={`px-4 py-2 rounded mt-6 text-white ${
    hasApproved ? 'bg-green-600 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'
  }`}
>
  Clear Approved
</button>
      <h3 className="text-lg font-semibold mb-4 text-blue-800">Your Applied Holidays</h3>
      {userHolidays.length > 0 ? (
        <ul className="space-y-2">
          {userHolidays.map((h, i) => (
            <li key={i} className={`p-3 rounded flex justify-between items-center ${statusColors[h.status]} text-black`}>
              <span>{format(new Date(h.start), 'MMM dd')} - {format(new Date(h.end), 'MMM dd')} ({h.status}) | {h.leaveType} | {h.duration} day(s) {h.remarks && `| "${h.remarks}"`}</span>
              {h.status === 'applied' && (
                <button className="bg-red-600 hover:bg-red-800 text-white px-2 py-1 rounded" onClick={() => cancelRequest(i)}>Cancel</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No holidays applied yet.</p>
      )}
    </div>
  );
}

function ManagerView() {
  const { holidays, setHolidays } = useContext(HolidayContext);

  const handleAction = (index, status) => {
    const updated = [...holidays];
    updated[index].status = status;
    setHolidays(updated);
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <Header />
      <h3 className="text-lg font-semibold mb-4 text-blue-800">All Employee Holiday Requests</h3>
      {holidays.length > 0 ? (
        <ul className="space-y-2">
          {holidays.map((h, i) => (
            <li key={i} className={`p-3 rounded flex justify-between items-center ${statusColors[h.status]} text-black`}>
              <span>{h.name}: {format(new Date(h.start), 'MMM dd')} - {format(new Date(h.end), 'MMM dd')} ({h.status}) | {h.leaveType} | {h.duration} day(s) {h.remarks && `| "${h.remarks}"`}</span>
              {h.status === 'applied' && (
                <div className="space-x-2">
                  <button onClick={() => handleAction(i, 'approved')} className="bg-green-600 px-2 py-1 rounded hover:bg-green-800">Approve</button>
                  <button onClick={() => handleAction(i, 'rejected')} className="bg-red-600 px-2 py-1 rounded hover:bg-red-800">Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No holiday requests yet.</p>
      )}
    </div>
  );
}

export default App;
