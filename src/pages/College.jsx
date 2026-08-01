import { useEffect, useState } from 'react';
import { useCollegeStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { TrashIcon, PlusIcon } from '../components/common/Icons';

const getLocalYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCreditCount = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('lab') || lowerName.includes('segc')) return 2;
  return 1;
};

const College = () => {
  const { 
    subjects, assignments, exams, projects, faculty, fetchCollegeData, 
    addSubject, logAttendance, undoAttendance, deleteSubject,
    addAssignment, toggleAssignment, deleteAssignment,
    addExam, deleteExam,
    addProject, toggleProject, deleteProject,
    addFaculty, deleteFaculty
  } = useCollegeStore();
  
  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const tabs = ['ATTENDANCE', 'ASSIGNMENTS', 'EXAMS', 'PROJECTS', 'FACULTY'];

  const [newSub, setNewSub] = useState({ name: '', faculty: '', day: 'Monday', time: '' });
  const [newAss, setNewAss] = useState({ title: '', subject: '', dueDate: '' });
  const [newExam, setNewExam] = useState({ title: '', subject: '', date: '', syllabus: '' });
  const [newProj, setNewProj] = useState({ title: '', subject: '', deadline: '' });
  const [newFac, setNewFac] = useState({ name: '', subject: '', contact: '' });
  
  const [targetPercentage, setTargetPercentage] = useState(75);
  
  const currentDayIndex = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[currentDayIndex];
  const initialDay = currentDayIndex === 0 ? 'Monday' : todayName;
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const todayStr = getLocalYMD();

  useEffect(() => {
    fetchCollegeData();
  }, [fetchCollegeData]);

  // Submit Handlers
  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSub.name.trim()) return;
    addSubject(newSub);
    setNewSub({ name: '', faculty: '', day: 'Monday', time: '' });
  };

  const handleAddAssignment = (e) => {
    e.preventDefault();
    if (!newAss.title.trim()) return;
    addAssignment(newAss);
    setNewAss({ title: '', subject: '', dueDate: '' });
  };

  const handleAddExam = (e) => {
    e.preventDefault();
    if (!newExam.title.trim()) return;
    addExam(newExam);
    setNewExam({ title: '', subject: '', date: '', syllabus: '' });
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProj.title.trim()) return;
    addProject(newProj);
    setNewProj({ title: '', subject: '', deadline: '' });
  };

  const handleAddFaculty = (e) => {
    e.preventDefault();
    if (!newFac.name.trim()) return;
    addFaculty(newFac);
    setNewFac({ name: '', subject: '', contact: '' });
  };

  // Math & Logic
  const scheduledSubjects = subjects.filter(s => s.day && dayNames.includes(s.day));
  const hasScheduledSubjects = scheduledSubjects.length > 0;
  
  const dynamicTimetable = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
  scheduledSubjects.forEach(sub => { 
    if (dynamicTimetable[sub.day]) dynamicTimetable[sub.day].push(sub); 
  });

  const totalAttended = subjects.reduce((sum, s) => sum + Number(s.attended || 0), 0);
  const totalClasses = subjects.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const overallPercentage = totalClasses === 0 ? 100 : Math.round((totalAttended / totalClasses) * 100);
  
  const calcRequired = () => {
    if (totalClasses === 0) return 0;
    const p = targetPercentage / 100;
    const required = Math.ceil((p * totalClasses - totalAttended) / (1 - p));
    return required > 0 ? required : 0;
  };

  const calcBunks = () => {
    if (totalClasses === 0) return 0;
    const p = targetPercentage / 100;
    const canMiss = Math.floor(totalAttended / p) - totalClasses;
    return canMiss > 0 ? canMiss : 0;
  };

  return (
    <div>
      <div className="page-header">
        <h1>🏫 College Hub</h1>
      </div>

      {/* TABS */}
      <div className="flex gap-12 mb-24" style={{ overflowX: 'auto', paddingBottom: '12px' }}>
        {tabs.map(tab => (
          <Button 
            key={tab} 
            variant={activeTab === tab ? 'dark' : 'ghost'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* 1. ATTENDANCE TAB */}
      {activeTab === 'ATTENDANCE' && (
        <>
          <Card className="mb-24">
            <div className="grid-2 flex-center" style={{ alignItems: 'center' }}>
              <div>
                <h3 className="mb-8">Overall Attendance</h3>
                <div className="flex flex-center gap-16">
                  <span className="card-value" style={{ color: overallPercentage < targetPercentage ? 'var(--red)' : 'var(--green)' }}>
                    {overallPercentage}%
                  </span>
                  <span className="text-muted" style={{ fontWeight: 700 }}>
                    {totalAttended} / {totalClasses} Classes
                  </span>
                </div>
              </div>

              <div style={{ borderLeft: 'var(--bw) solid var(--border)', paddingLeft: '24px' }}>
                <div className="flex flex-center gap-8 mb-8">
                  <label style={{ fontWeight: 800 }}>Target:</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '90px', padding: '6px 10px' }} 
                    value={targetPercentage} 
                    onChange={(e) => setTargetPercentage(Number(e.target.value))} 
                  />
                  <span style={{ fontWeight: 900 }}>%</span>
                </div>

                {totalClasses === 0 ? (
                  <div style={{ fontWeight: 700 }}>Log a class to see stats!</div>
                ) : overallPercentage < targetPercentage ? (
                  <div className="text-red" style={{ fontWeight: 800 }}>⚠️ Need {calcRequired()} more to reach {targetPercentage}%.</div>
                ) : (
                  <div className="text-green" style={{ fontWeight: 800 }}>✅ Safely miss {calcBunks()} classes.</div>
                )}
              </div>
            </div>
          </Card>

          {hasScheduledSubjects && (
            <Card className="mb-24">
              <div className="flex flex-between mb-16 flex-wrap gap-12">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>📅 Weekly Schedule</h2>
                <div className="flex gap-8" style={{ overflowX: 'auto' }}>
                  {Object.keys(dynamicTimetable).map(day => (
                    <Button 
                      key={day} 
                      size="sm"
                      variant={selectedDay === day ? 'dark' : 'ghost'}
                      onClick={() => setSelectedDay(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
                {dynamicTimetable[selectedDay].length === 0 ? (
                  <div className="empty-state">No classes scheduled for {selectedDay}.</div>
                ) : (
                  dynamicTimetable[selectedDay].map((cls) => {
                    const isTodayTab = selectedDay === todayName;
                    const alreadyLogged = isTodayTab && cls.lastLog?.date === todayStr;
                    const count = getCreditCount(cls.name);
                    
                    return (
                      <div key={cls.id} className="card flex flex-between flex-wrap gap-12" style={{ padding: '16px', background: 'var(--bg)' }}>
                        <div className="flex flex-center gap-16">
                          <div style={{ minWidth: '100px', fontWeight: 800, fontSize: '0.9rem' }}>{cls.time || 'TBA'}</div>
                          <div style={{ borderLeft: 'var(--bw) solid var(--border)', paddingLeft: '16px' }}>
                            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{cls.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cls.faculty || 'No Faculty'}</div>
                          </div>
                        </div>

                        {alreadyLogged ? (
                          <div className="flex flex-center gap-12">
                            <span style={{ fontWeight: 900, color: cls.lastLog.isPresent ? 'var(--green)' : 'var(--red)' }}>
                              {cls.lastLog.isPresent ? '✓ PRESENT' : '✕ ABSENT'}
                            </span>
                            <Button size="sm" variant="dark" onClick={() => undoAttendance(cls.id)}>UNDO</Button>
                          </div>
                        ) : (
                          <div className="flex gap-12">
                            <Button size="sm" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => logAttendance(cls.id, true, count)}>+ P</Button>
                            <Button size="sm" variant="danger" onClick={() => logAttendance(cls.id, false, count)}>- A</Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}
          
          {/* Add Subject Card */}
          <Card className="mb-24">
            <form onSubmit={handleAddSubject} className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Add a Class to Schedule</div>
              <div className="form-row">
                <input className="form-input" type="text" placeholder="Subject Name*" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} required />
                <input className="form-input" type="text" placeholder="Faculty Name" value={newSub.faculty} onChange={e => setNewSub({...newSub, faculty: e.target.value})} />
              </div>
              <div className="form-row">
                <select className="form-select" value={newSub.day} onChange={e => setNewSub({...newSub, day: e.target.value})}>
                  {dayNames.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="Online/Misc">Online / Misc (Skip Schedule)</option>
                </select>
                <input className="form-input" type="text" placeholder="Time (e.g. 10:00 AM)" value={newSub.time} onChange={e => setNewSub({...newSub, time: e.target.value})} />
                <Button type="submit" variant="primary" icon={<PlusIcon />}>Add Subject</Button>
              </div>
            </form>
          </Card>

          {/* Subject Cards Grid */}
          <div className="dash-grid">
            {subjects.map(subject => {
              const percentage = subject.total === 0 ? 100 : Math.round((subject.attended / subject.total) * 100);
              const isDanger = percentage < targetPercentage && subject.total > 0;
              const alreadyLogged = subject.lastLog?.date === todayStr;
              const count = getCreditCount(subject.name);

              return (
                <Card key={subject.id} style={{ position: 'relative' }}>
                  <button className="btn-icon" onClick={() => deleteSubject(subject.id)} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <TrashIcon size={14} />
                  </button>
                  <h3 style={{ margin: '0 0 12px 0', paddingRight: '40px', fontWeight: 900 }}>{subject.name}</h3>
                  <div className="flex flex-between mb-16" style={{ marginTop: '16px' }}>
                    <div className="card-value" style={{ color: isDanger ? 'var(--red)' : 'var(--green)' }}>{percentage}%</div>
                    <div style={{ textAlign: 'right', fontWeight: 700 }}>
                      <div>{subject.attended} / {subject.total}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>Classes Attended</div>
                    </div>
                  </div>
                  {alreadyLogged ? (
                    <div className="flex flex-between flex-center card" style={{ padding: '8px 12px', background: 'var(--bg)' }}>
                      <span style={{ fontWeight: 900, color: subject.lastLog.isPresent ? 'var(--green)' : 'var(--red)' }}>
                        {subject.lastLog.isPresent ? '✓ PRESENT' : '✕ ABSENT'}
                      </span>
                      <Button size="sm" variant="dark" onClick={() => undoAttendance(subject.id)}>UNDO</Button>
                    </div>
                  ) : (
                    <div className="grid-2">
                      <Button size="sm" style={{ background: 'var(--green)', color: '#fff' }} onClick={() => logAttendance(subject.id, true, count)}>+ PRESENT</Button>
                      <Button size="sm" variant="danger" onClick={() => logAttendance(subject.id, false, count)}>- ABSENT</Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* 2. ASSIGNMENTS TAB */}
      {activeTab === 'ASSIGNMENTS' && (
        <>
          <Card className="mb-24">
            <form onSubmit={handleAddAssignment} className="form-row">
              <input className="form-input" type="text" placeholder="Assignment Title*" value={newAss.title} onChange={e => setNewAss({...newAss, title: e.target.value})} required />
              <input className="form-input" type="text" placeholder="Subject" value={newAss.subject} onChange={e => setNewAss({...newAss, subject: e.target.value})} />
              <input className="form-input" type="date" value={newAss.dueDate} onChange={e => setNewAss({...newAss, dueDate: e.target.value})} />
              <Button type="submit" variant="yellow" icon={<PlusIcon />}>Add Task</Button>
            </form>
          </Card>
          
          <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
            {assignments.length === 0 ? (
              <div className="empty-state">No assignments pending!</div>
            ) : assignments.map(ass => (
              <Card key={ass.id} className="flex flex-between flex-center" style={{ padding: '16px', background: ass.completed ? '#f0fdf4' : 'var(--bg2)' }}>
                <div className="flex flex-center gap-16">
                  <input type="checkbox" checked={ass.completed} onChange={() => toggleAssignment(ass.id, ass.completed)} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
                  <div>
                    <h3 style={{ margin: 0, textDecoration: ass.completed ? 'line-through' : 'none', color: ass.completed ? 'var(--text3)' : 'var(--text)' }}>
                      {ass.title}
                    </h3>
                    <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
                      {ass.subject} • Due: {ass.dueDate || 'No Date'}
                    </div>
                  </div>
                </div>
                <button className="btn-icon" onClick={() => deleteAssignment(ass.id)}>
                  <TrashIcon size={14} />
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 3. EXAMS TAB */}
      {activeTab === 'EXAMS' && (
        <>
          <Card className="mb-24">
            <form onSubmit={handleAddExam} className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
              <div className="form-row">
                <input className="form-input" type="text" placeholder="Exam Title (e.g. Midterm)*" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} required />
                <input className="form-input" type="text" placeholder="Subject" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} />
                <input className="form-input" type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} />
              </div>
              <input className="form-input" type="text" placeholder="Syllabus / Notes" value={newExam.syllabus} onChange={e => setNewExam({...newExam, syllabus: e.target.value})} />
              <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} icon={<PlusIcon />}>Add Exam</Button>
            </form>
          </Card>
          
          <div className="dash-grid">
            {exams.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>No upcoming exams!</div>
            ) : exams.map(exam => (
              <Card key={exam.id} style={{ position: 'relative' }}>
                <button className="btn-icon" onClick={() => deleteExam(exam.id)} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <TrashIcon size={14} />
                </button>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--purple)', marginBottom: '8px' }}>{exam.date || 'TBA'}</div>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 900 }}>{exam.title}</h3>
                <div className="text-muted mb-16" style={{ fontWeight: 700 }}>{exam.subject}</div>
                {exam.syllabus && <div className="card" style={{ padding: '12px', background: 'var(--bg)', fontSize: '0.9rem', fontWeight: 600 }}>{exam.syllabus}</div>}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 4. PROJECTS TAB */}
      {activeTab === 'PROJECTS' && (
        <>
          <Card className="mb-24">
            <form onSubmit={handleAddProject} className="form-row">
              <input className="form-input" type="text" placeholder="Project Name*" value={newProj.title} onChange={e => setNewProj({...newProj, title: e.target.value})} required />
              <input className="form-input" type="text" placeholder="Subject / Tech Stack" value={newProj.subject} onChange={e => setNewProj({...newProj, subject: e.target.value})} />
              <input className="form-input" type="date" value={newProj.deadline} onChange={e => setNewProj({...newProj, deadline: e.target.value})} />
              <Button type="submit" variant="primary" icon={<PlusIcon />}>Add Project</Button>
            </form>
          </Card>

          <div className="dash-grid">
            {projects.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>No active projects!</div>
            ) : projects.map(proj => (
              <Card key={proj.id} style={{ position: 'relative', background: proj.completed ? '#fdf2f8' : 'var(--bg2)' }}>
                <button className="btn-icon" onClick={() => deleteProject(proj.id)} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <TrashIcon size={14} />
                </button>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 900, textDecoration: proj.completed ? 'line-through' : 'none' }}>{proj.title}</h3>
                <div className="text-muted mb-16" style={{ fontWeight: 700 }}>{proj.subject} • Due: {proj.deadline || 'TBA'}</div>
                <Button size="sm" variant={proj.completed ? 'dark' : 'yellow'} style={{ width: '100%' }} onClick={() => toggleProject(proj.id, proj.completed)}>
                  {proj.completed ? 'MARK INCOMPLETE' : 'MARK COMPLETE'}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 5. FACULTY TAB */}
      {activeTab === 'FACULTY' && (
        <>
          <Card className="mb-24">
            <form onSubmit={handleAddFaculty} className="form-row">
              <input className="form-input" type="text" placeholder="Faculty Name*" value={newFac.name} onChange={e => setNewFac({...newFac, name: e.target.value})} required />
              <input className="form-input" type="text" placeholder="Subject*" value={newFac.subject} onChange={e => setNewFac({...newFac, subject: e.target.value})} required />
              <input className="form-input" type="text" placeholder="Office / Contact info" value={newFac.contact} onChange={e => setNewFac({...newFac, contact: e.target.value})} />
              <Button type="submit" variant="primary" icon={<PlusIcon />}>Add Faculty</Button>
            </form>
          </Card>

          <div className="dash-grid">
            {faculty.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>No faculty added!</div>
            ) : faculty.map(fac => (
              <Card key={fac.id} style={{ position: 'relative', borderLeft: '6px solid var(--accent)' }}>
                <button className="btn-icon" onClick={() => deleteFaculty(fac.id)} style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <TrashIcon size={14} />
                </button>
                <h3 style={{ margin: '0 0 4px 0', fontWeight: 900 }}>{fac.name}</h3>
                <div className="text-muted" style={{ fontWeight: 700 }}>{fac.subject}</div>
                {fac.contact && <div className="card mt-16" style={{ padding: '8px 12px', background: 'var(--bg)', fontSize: '0.85rem', fontWeight: 700 }}>📍 {fac.contact}</div>}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default College;