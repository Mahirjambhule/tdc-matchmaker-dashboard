import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Award, Sparkles, CheckCircle2, X, Trash2, Clock } from 'lucide-react';

export default function DetailedMatchView({ customerId, onBack }) {
  const [client, setClient] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [journeyStatus, setJourneyStatus] = useState('');
  const [updatingLogs, setUpdatingLogs] = useState(false);
  const [isRankedByAI, setIsRankedByAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeModalMatch, setActiveModalMatch] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [selectedMatchForExplanation, setSelectedMatchForExplanation] = useState(null);
  const [selectedMatchScore, setSelectedMatchScore] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const clientData = await api.getCustomerById(customerId);
      const matchesData = await api.getAlgorithmicMatches(customerId);

      const clientAge = new Date().getFullYear() - new Date(clientData.dateOfBirth).getFullYear();
      const clientHeight = parseFloat(clientData.height) || 160;
      const clientIncome = parseFloat(clientData.income) || 0;

      const scoredPool = matchesData.map(candidate => {
        const matchProfile = candidate.profile;
        if (!matchProfile) return null;

        if (clientData.religion?.toLowerCase() !== matchProfile.religion?.toLowerCase()) {
          return null;
        }

        let score = 50;
        const candidateAge = new Date().getFullYear() - new Date(matchProfile.dateOfBirth).getFullYear();
        const candidateHeight = parseFloat(matchProfile.height) || 160;
        const candidateIncome = parseFloat(matchProfile.income) || 0;

        if (clientData.gender === 'Male') {
          const isYounger = candidateAge < clientAge;
          const earnsLess = candidateIncome < clientIncome;
          const isShorter = candidateHeight < clientHeight;
          const matchesKidsView = clientData.wantKids === matchProfile.wantKids;

          if (isYounger) score += 15;
          if (earnsLess) score += 15;
          if (isShorter) score += 15;
          if (matchesKidsView) score += 15;

          if (!isYounger || !earnsLess || !isShorter) {
            score -= 25;
          }
        } else {
          if (clientData.designation?.toLowerCase() === matchProfile.designation?.toLowerCase() ||
            clientData.company?.toLowerCase() === matchProfile.company?.toLowerCase()) {
            score += 15;
          }
          if (clientData.familyValues === matchProfile.familyValues) {
            score += 15;
          }
          if (clientData.openToRelocate === matchProfile.openToRelocate) {
            score += 15;
          }
          if (clientData.wantKids === matchProfile.wantKids) {
            score += 15;
          }
        }

        if (clientData.caste?.toLowerCase() === matchProfile.caste?.toLowerCase()) {
          score += 10;
        }

        return {
          ...candidate,
          suitabilityScore: score,
          matchingCriteria: []
        };
      }).filter(Boolean);

      const top10Candidates = scoredPool
        .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
        .slice(0, 10)
        .map(c => ({ ...c, aiScore: null, rankLabel: null, aiExplanation: null }));

      setClient(clientData);
      setJourneyStatus(clientData.journeyStatus);
      setCandidates(top10Candidates);
      setIsRankedByAI(false);
    } catch (err) {
      console.error("Error setting up matchmaker channels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspaceData(); }, [customerId]);

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

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteCustomerLog(client._id, noteId);
      await loadWorkspaceData();
    } catch (err) {
      console.error("Note deletion fault:", err);
    }
  };

  const executeBulkAIRanking = async () => {
    try {
      setLoadingAI(true);
      const finalRankedTop10 = [];

      for (const candidate of candidates) {
        try {
          await new Promise(resolve => setTimeout(resolve, 350));
          const response = await api.getAIMatchAnalysis({ clientId: client._id, matchId: candidate.profile._id });
          let rankExplanation = response.compatibilityScore >= 90 ? "Elite High-Potential Match" : response.compatibilityScore >= 80 ? "High Potential Match" : "Standard Potential Match";

          finalRankedTop10.push({ ...candidate, aiScore: response.compatibilityScore, rankLabel: rankExplanation, aiExplanation: response });
        } catch (innerErr) {
          finalRankedTop10.push({
            ...candidate,
            aiScore: Math.min(Math.max(candidate.suitabilityScore, 45), 95),
            rankLabel: "Matrix Calculated Fit",
            aiExplanation: { compatibilityScore: candidate.suitabilityScore, strengths: ["Profile attributes align cleanly cross-demographically."], challenges: ["Processing ceiling limit default fallback applied."] }
          });
        }
      }
      finalRankedTop10.sort((a, b) => b.aiScore - a.aiScore);
      setCandidates(finalRankedTop10);
      setIsRankedByAI(true);
    } catch (err) {
      console.error(err);
    } finally { setLoadingAI(false); }
  };

  const handleScoreClick = (e, candidate) => {
    e.stopPropagation();
    if (!isRankedByAI || candidate.aiScore === null) return;
    setSelectedMatchForExplanation(candidate.profile);
    setSelectedMatchScore(candidate.aiScore);
    setAiAnalysis(candidate.aiExplanation);
  };

  if (loading || !client) return <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div><p className="text-sm font-medium text-gray-500">Assembling workspace dossiers...</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Column Sidebar Dossier Overview Panel */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-serif font-bold text-lg">{client.firstName[0]}</div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900">{client.firstName} {client.lastName}</h3>
                  <p className="text-xs text-gray-400 font-medium">{client.gender} • {client.maritalStatus}</p>
                </div>
              </div>

              <div className="py-4 space-y-4 text-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Full Biodata Dossier</h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Age</p><p className="font-medium text-gray-800">{new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} Yrs</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Height</p><p className="font-medium text-gray-800">{client.height} cm</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">City</p><p className="font-medium text-gray-800">{client.city}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Income Bracket</p><p className="font-medium text-emerald-700 font-semibold">{client.income} LPA</p></div>

                  <div className="col-span-2 border-t border-gray-50 pt-2">
                    <p className="text-[11px] text-gray-400 uppercase font-medium">Religion / Caste</p>
                    <p className="font-bold text-gray-800 text-xs mt-0.5">{client.religion} / {client.caste || 'None'}</p>
                  </div>

                  <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Profession</p><p className="font-medium text-gray-800 truncate">{client.designation} @ {client.company}</p></div>
                  <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Education Background</p><p className="font-medium text-gray-800 truncate text-xs">{client.degree}, {client.college}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Dietary Preference</p><p className="font-medium text-gray-800">{client.diet}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Core Values</p><p className="font-medium text-gray-800">{client.familyValues}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Relocate</p><p className="font-medium text-gray-700">{client.openToRelocate}</p></div>
                  <div><p className="text-[11px] text-gray-400 uppercase font-medium">Pets</p><p className="font-medium text-gray-700">{client.openToPets}</p></div>
                  <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Wants Children</p><p className="font-medium text-gray-800">{client.wantKids}</p></div>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateLogs} className="pt-4 border-t border-gray-100 mt-auto space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Update Journey Stage</label>
                <select value={journeyStatus} onChange={(e) => setJourneyStatus(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-amber-500">
                  <option value="Profile Verified">Profile Verified</option>
                  <option value="Searching Matches">Searching Matches</option>
                  <option value="Interaction Stage">Interaction Stage</option>
                  <option value="Matched">Matched</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Add Operational Log Note</label>
                <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type session summary notes..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500" />
              </div>
              <button type="submit" disabled={updatingLogs} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer">{updatingLogs ? 'Saving Entry...' : 'Commit Logs Entry'}</button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col space-y-3 max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Matchmaker Notes Audit History</span>
            </h4>
            <div className="space-y-2.5">
              {client.matchmakerNotes && client.matchmakerNotes.length > 0 ? (
                client.matchmakerNotes.map((noteItem) => (
                  <div key={noteItem._id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start justify-between gap-3 group/note">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 break-words leading-relaxed">{noteItem.note}</p>
                      <p className="text-[9px] font-mono text-gray-400">{new Date(noteItem.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteNote(noteItem._id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md bg-white border border-gray-200 shadow-2xs hover:border-red-200 transition-all shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-2 text-center">No structural entries submitted for this file layout.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column Matching Results Queue Dashboard Container */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col h-full max-h-[720px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900 mb-1 flex items-center space-x-2"><Award className="w-5 h-5 text-amber-500" /><span>Algorithmic Matching Results Queue</span></h3>
                <p className="text-xs text-gray-400 font-medium">Displaying targeted data-matched opposite gender choices based on matrimonial sorting rules parameters.</p>
              </div>

              {/* 💡 REDESIGNED: Premium Neon Glow-Border AI Execution Trigger Element Control Block */}
              <button
                onClick={executeBulkAIRanking}
                disabled={loadingAI}
                className="w-full sm:w-auto relative group overflow-hidden rounded-xl p-[1.5px] focus:outline-none transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.45)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-xl animate-pulse opacity-90 blur-xs" />
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl" />
                <span className="relative flex items-center justify-center space-x-2 px-5 py-3 rounded-[10px] bg-slate-950 text-white transition-colors duration-200">
                  <Sparkles className={`w-4 h-4 text-amber-400 ${loadingAI ? 'animate-spin' : 'animate-bounce'}`} />
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-200 bg-clip-text text-transparent font-mono font-bold text-[10px] tracking-wider uppercase">
      {loadingAI ? 'AI MATCHING...' : isRankedByAI ? 'REFRESH AI MATCH' : 'MATCH BETTER WITH AI'}
    </span>
                </span>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto mt-4 pr-2 flex-1 min-h-0">
              {candidates.map((candidate) => {
                const match = candidate.profile;
                return (
                  <div
                    key={match._id}
                    onClick={() => setPreviewProfile(match)}
                    className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center group hover:border-gray-200 cursor-pointer transition-all"
                  >
                    <div className="space-y-2 max-w-md flex-1">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="font-serif font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors">{match.firstName} {match.lastName}</span>
                        <span className="text-xs text-gray-400">({new Date().getFullYear() - new Date(match.dateOfBirth).getFullYear()} Yrs, {match.city})</span>
                        {isRankedByAI && candidate.rankLabel && <span className="font-mono font-bold text-[9px] px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 border border-white/10">{candidate.rankLabel}</span>}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{match.designation} at {match.company} • {match.income} LPA</p>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0 w-full sm:w-auto justify-end">
                      {isRankedByAI && (
                        <div onClick={(e) => handleScoreClick(e, candidate)} className="p-2.5 rounded-xl text-center shadow-xs w-16 cursor-pointer border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800">
                          <p className="text-[8px] uppercase tracking-wider font-bold font-mono text-amber-600">AI Score</p>
                          <p className="text-sm font-black font-mono tracking-tight">{candidate.aiScore}%</p>
                        </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setActiveModalMatch(match); }} className="text-[11px] font-semibold bg-emerald-600 text-white px-3 py-2.5 rounded-xl h-11 flex items-center justify-center space-x-1 hover:bg-opacity-95 shadow-xs"><span>Send Match</span></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedMatchForExplanation && aiAnalysis && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-slate-950 text-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-800 relative">
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <h4 className="font-serif text-base font-bold text-amber-400 tracking-wide">Match Logic Compliance Matrix Review</h4>
              <button onClick={() => setSelectedMatchForExplanation(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="sm:col-span-3 flex justify-center"><div className="w-16 h-16 rounded-full border-4 border-amber-500 bg-slate-900 flex items-center justify-center font-mono font-bold text-lg text-amber-400">{selectedMatchScore}%</div></div>
                <div className="sm:col-span-9 space-y-1">
                  <p className="font-serif text-sm font-bold text-white">Dynamic Audit Evaluation ({selectedMatchForExplanation.firstName} {selectedMatchForExplanation.lastName})</p>
                  <p className="text-[11px] text-gray-400">Granular reasoning breakdown scoring metrics across structural preferences layouts.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                  <p className="font-bold text-emerald-400 text-[10px] uppercase">✦ Compatibility Strengths</p>
                  <ul className="space-y-2.5 text-gray-300 list-none pl-0">{aiAnalysis.strengths?.map((s, i) => <li key={i} className="leading-relaxed break-words whitespace-pre-wrap">• {s}</li>)}</ul>
                </div>
                <div className="space-y-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                  <p className="font-bold text-amber-400 text-[10px] uppercase">▲ Friction Risk Assessment</p>
                  <ul className="space-y-2.5 text-gray-300 list-none pl-0">{aiAnalysis.challenges?.map((c, i) => <li key={i} className="leading-relaxed break-words whitespace-pre-wrap">• {c}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-slate-900/40 shrink-0"><button onClick={() => setSelectedMatchForExplanation(null)} className="w-full bg-white/10 text-white border border-white/10 text-xs font-bold py-2.5 rounded-xl transition-all">Close Compliance Breakdown</button></div>
          </div>
        </div>
      )}

      {activeModalMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs"><CheckCircle2 className="w-6 h-6" /></div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-gray-900">Premium Match Email Dispatched!</h3>
              <p className="text-xs text-gray-400 font-medium">A premium discovery dispatch notification has been compiled and emailed to <span className="font-bold text-gray-600">{client.firstName}</span>.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200/60 p-4 rounded-xl text-left text-xs space-y-2 font-medium shadow-2xs">
              <p className="font-bold text-amber-600 border-b border-gray-200/60 pb-1.5 uppercase tracking-wider text-[10px]">Suggested Match Profile Information</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Candidate Name:</span> {activeModalMatch.firstName} {activeModalMatch.lastName}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Religion / Caste:</span> {activeModalMatch.religion} / {activeModalMatch.caste || 'None'}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Age / Height:</span> {new Date().getFullYear() - new Date(activeModalMatch.dateOfBirth).getFullYear()} Yrs • {activeModalMatch.height} cm</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Professional Track:</span> {activeModalMatch.designation} at {activeModalMatch.company}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Financial Bracket:</span> <span className="text-emerald-700 font-bold">{activeModalMatch.income} LPA</span></p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Location Hub:</span> {activeModalMatch.city}, India</p>
            </div>
            <button onClick={() => setActiveModalMatch(null)} className="w-full bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer">Return to Suite</button>
          </div>
        </div>
      )}

      {previewProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 relative">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-serif font-bold text-sm">{previewProfile.firstName[0]}</div>
                <div>
                  <h4 className="font-serif text-base font-bold text-gray-900">{previewProfile.firstName} {previewProfile.lastName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Comprehensive Candidate Dossier</p>
                </div>
              </div>
              <button onClick={() => setPreviewProfile(null)} className="text-gray-400 hover:text-gray-600 p-1.5 bg-gray-50 rounded-lg border border-gray-200/50"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Marital Status</p><p className="font-semibold text-gray-800 text-sm mt-0.5">{previewProfile.maritalStatus}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Income Level</p><p className="font-bold text-emerald-700 text-sm mt-0.5">{previewProfile.income} LPA</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Current Location</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.city}, India</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Open to Relocate</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.openToRelocate}</p></div>
                <div className="col-span-2 border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Professional Track</p><p className="font-semibold text-gray-800 mt-0.5">{previewProfile.designation}</p><p className="text-gray-500 font-medium">{previewProfile.company}</p></div>
                <div className="col-span-2 border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Academic Credentials</p><p className="font-semibold text-gray-800 mt-0.5">{previewProfile.degree}</p><p className="text-gray-500 text-[11px] font-medium">{previewProfile.college}</p></div>
                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Age / Height Dimensions</p><p className="font-medium text-gray-700 mt-0.5">{new Date().getFullYear() - new Date(previewProfile.dateOfBirth).getFullYear()} Yrs • {previewProfile.height} cm</p></div>

                <div className="border-t border-gray-200/50 pt-2">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Religion / Caste</p>
                  <p className="font-bold text-amber-800 mt-0.5">{previewProfile.religion} / {previewProfile.caste || 'None'}</p>
                </div>

                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Dietary Preferences</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.diet}</p></div>
                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Family Values Framework</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.familyValues} Orientation</p></div>
                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Open to Pets</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.openToPets}</p></div>
                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Wants Children</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.wantKids}</p></div>
                <div className="col-span-2 border-t border-gray-200/50 pt-2 grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email Address</p><p className="font-medium text-slate-700 break-all mt-0.5">{previewProfile.email}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Phone / Contact</p><p className="font-medium text-slate-700 mt-0.5">{previewProfile.phone}</p></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center space-x-3">
              <button onClick={() => setPreviewProfile(null)} className="w-full bg-gray-200 text-gray-700 text-xs font-semibold py-3 rounded-xl transition-all">Close Full Dossier Overview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}