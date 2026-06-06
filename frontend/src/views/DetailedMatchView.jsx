import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, MapPin, MessageSquare, Send, Award, Sparkles, CheckCircle2, X } from 'lucide-react';

export default function DetailedMatchView({ customerId, onBack }) {
  const [client, setClient] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newNote, setNewNote] = useState('');
  const [journeyStatus, setJourneyStatus] = useState('');
  const [updatingLogs, setUpdatingLogs] = useState(false);

  const [selectedMatchForAI, setSelectedMatchForAI] = useState(null); 
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeModalMatch, setActiveModalMatch] = useState(null); 

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const clientData = await api.getCustomerById(customerId);
      const matchesData = await api.getAlgorithmicMatches(customerId);
      
      setClient(clientData);
      setJourneyStatus(clientData.journeyStatus);
      setCandidates(matchesData);
    } catch (err) {
      console.error("Error setting up matchmaker channels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [customerId]);

  const handleUpdateLogs = async (e) => {
    e.preventDefault();
    if (!newNote && journeyStatus === client.journeyStatus) return;
    try {
      setUpdatingLogs(true);
      await api.updateCustomerLogs(client._id, journeyStatus, newNote);
      setNewNote('');
      await loadWorkspaceData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingLogs(false);
    }
  };

  const triggerAIProfiling = async (matchProfile) => {
    try {
      setSelectedMatchForAI(matchProfile);
      setAiAnalysis(null);
      setLoadingAI(true);
      
      const analysis = await api.getAIMatchAnalysis(client._id, matchProfile._id);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error(err);
      setSelectedMatchForAI(null);
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tdc-logo-gold mx-auto mb-4"></div>
        <p className="text-sm text-gray-500 font-medium">Assembling client profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-tdc-cream flex items-center justify-center text-tdc-logo-gold font-serif font-bold text-lg">
                {client.firstName[0]}
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-tdc-dark">{client.firstName} {client.lastName}</h3>
                <p className="text-xs text-gray-400 font-medium">{client.gender} • {client.maritalStatus}</p>
              </div>
            </div>

            <div className="py-4 space-y-4 text-sm border-b border-gray-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-tdc-logo-gold">Full Biodata Dossier</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Age</p><p className="font-medium text-gray-800">{new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} Yrs</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Height</p><p className="font-medium text-gray-800">{client.height} cm</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">City</p><p className="font-medium text-gray-800">{client.city}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Income Bracket</p><p className="font-medium text-emerald-700 font-semibold">{client.income} LPA</p></div>
                <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Profession</p><p className="font-medium text-gray-800 truncate">{client.designation} @ {client.company}</p></div>
                <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Education Background</p><p className="font-medium text-gray-800 truncate text-xs">{client.degree}, {client.college}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Religion / Caste</p><p className="font-medium text-gray-800">{client.religion} ({client.caste})</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Dietary Preference</p><p className="font-medium text-gray-800">{client.diet}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Family Core Values</p><p className="font-medium text-gray-800">{client.familyValues}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Open to Relocate</p><p className="font-medium text-gray-800">{client.openToRelocate}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Open to Pets</p><p className="font-medium text-gray-800">{client.openToPets}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Wants Children</p><p className="font-medium text-gray-800">{client.wantKids}</p></div>
              </div>
            </div>

            <form onSubmit={handleUpdateLogs} className="pt-4 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-tdc-logo-gold">Matchmaker Tracking Desk</h4>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase mb-1">Update Journey Phase</label>
                <select
                  value={journeyStatus}
                  onChange={(e) => setJourneyStatus(e.target.value)}
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="Profile Verified">Profile Verified</option>
                  <option value="Searching Matches">Searching Matches</option>
                  <option value="Interaction Stage">Interaction Stage</option>
                  <option value="Matched">Matched</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-400 uppercase mb-1">Append Internal Consultation Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record insights from call..."
                  rows={3}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={updatingLogs}
                className="w-full bg-tdc-green text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {updatingLogs ? 'Saving updates...' : 'Commit Logs Entry'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" /> <span>Consultation Log History</span>
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {client.matchmakerNotes.slice().reverse().map((note, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-700">
                  <p className="font-medium leading-relaxed">{note.note}</p>
                  <span className="text-[10px] text-gray-400 block mt-1.5 font-mono text-right">
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h3 className="font-serif text-lg font-bold text-tdc-dark mb-1 flex items-center space-x-2">
              <Award className="w-5 h-5 text-tdc-logo-gold" />
              <span>Algorithmic Matching Pipeline Results</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-6">Displaying matches ordered by structural compliance parameters.</p>
            
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {candidates.map(({ profile: match, score, matchingCriteria }) => (
                <div 
                  key={match._id}
                  className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl hover:border-gray-200 transition-all flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                >
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-serif font-bold text-sm text-tdc-dark">{match.firstName} {match.lastName}</span>
                      <span className="text-xs text-gray-400">({new Date().getFullYear() - new Date(match.dateOfBirth).getFullYear()} Yrs, {match.city})</span>
                      <span className="bg-tdc-logo-gold/10 text-tdc-logo-gold font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-tdc-logo-gold/20">
                        {score}% Matrix Compliance
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {match.designation} at <span className="font-semibold text-gray-700">{match.company}</span> • {match.income} LPA
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matchingCriteria.map((c, idx) => (
                        <span key={idx} className="bg-white text-gray-500 text-[9px] font-medium border border-gray-200 rounded-md px-1.5 py-0.5">
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => triggerAIProfiling(match)}
                      className="flex-1 sm:flex-none text-[11px] font-semibold bg-white border border-gray-200 text-tdc-logo-gold hover:bg-tdc-cream/30 px-3 py-2 rounded-xl transition-all flex items-center justify-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" /> <span>Run AI Deep Match</span>
                    </button>
                    <button
                      onClick={() => setActiveModalMatch(match)}
                      className="flex-1 sm:flex-none text-[11px] font-semibold bg-tdc-green text-white hover:bg-tdc-green-hover px-3 py-2 rounded-xl transition-all flex items-center justify-center space-x-1"
                    >
                      <Send className="w-3 h-3" /> <span>Send Match</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {selectedMatchForAI && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-slate-950 text-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 relative animate-scaleUp">
            
            <div className="absolute right-0 top-0 w-32 h-32 bg-tdc-logo-gold/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* STICKY POPUP HEADER */}
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-tdc-text-gold animate-pulse" />
                <h4 className="font-serif text-base font-bold text-tdc-text-gold tracking-wide">
                  TDC Compatibility Intelligence Review
                </h4>
              </div>
              <button 
                onClick={() => setSelectedMatchForAI(null)}
                className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
              {loadingAI ? (
                <div className="py-16 text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tdc-text-gold mx-auto"></div>
                  <p className="text-xs text-gray-400 font-mono">Running cross-profile synchronization matrices...</p>
                </div>
              ) : aiAnalysis && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="sm:col-span-3 flex justify-center">
                      <div className="w-16 h-16 rounded-full border-4 border-tdc-logo-gold bg-slate-900 flex items-center justify-center font-mono font-bold text-base text-tdc-text-gold">
                        {aiAnalysis.compatibilityScore}%
                      </div>
                    </div>
                    <div className="sm:col-span-9 space-y-1 text-center sm:text-left">
                      <p className="font-serif text-sm font-bold text-white">
                        Synergy Matrix Verified (Candidate: {selectedMatchForAI.firstName} {selectedMatchForAI.lastName})
                      </p>
                      <p className="text-[11px] text-gray-400 leading-normal">
                        Calculated match compatibility factoring in sub-textual lifestyle views, long-term visions, and professional trajectories.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    
                    <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                      <p className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center">
                        <span className="mr-1.5">✦</span> Strategic Compatibility Pillars
                      </p>
                      <ul className="space-y-2 text-gray-300 list-none pl-0">
                        {aiAnalysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start space-x-2 leading-relaxed">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {aiAnalysis.challenges && aiAnalysis.challenges.length > 0 && (
                      <div className="space-y-2 bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                        <p className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center">
                          <span className="mr-1.5">▲</span> Identified Friction Points
                        </p>
                        <ul className="space-y-2 text-gray-300 list-none pl-0">
                          {aiAnalysis.challenges.map((c, i) => (
                            <li key={i} className="flex items-start space-x-2 leading-relaxed">
                              <span className="text-amber-400 font-bold shrink-0">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>

            {aiAnalysis && !loadingAI && (
              <div className="p-4 border-t border-white/10 bg-slate-900/40 shrink-0">
                <button
                  onClick={() => {
                    const selectedProfile = selectedMatchForAI;
                    setSelectedMatchForAI(null);
                    setActiveModalMatch(selectedProfile);
                  }}
                  className="w-full bg-tdc-logo-gold hover:bg-opacity-90 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Accept Synergy &amp; Dispatch Match Profile
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {activeModalMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-gray-900">Match Connection Dispatched!</h3>
              <p className="text-xs text-gray-400">
                A premium discovery dispatch profile has been compiled and emailed to <span className="font-semibold text-gray-600">{client.firstName}</span>.
              </p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-xl text-left text-xs space-y-1.5">
              <p className="font-semibold text-gray-800">Included Profile Details:</p>
              <p className="text-gray-600"><span className="font-medium text-gray-400">Candidate:</span> {activeModalMatch.firstName} {activeModalMatch.lastName}</p>
              <p className="text-gray-600"><span className="font-medium text-gray-400">Background:</span> {activeModalMatch.designation} at {activeModalMatch.company} ({activeModalMatch.income} LPA)</p>
              <p className="text-gray-600"><span className="font-medium text-gray-400">Location Details:</span> {activeModalMatch.city}, India</p>
            </div>
            <button
              onClick={() => setActiveModalMatch(null)}
              className="w-full bg-tdc-green text-white text-xs font-semibold py-2.5 rounded-xl"
            >
              Return to Workspace Suite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}