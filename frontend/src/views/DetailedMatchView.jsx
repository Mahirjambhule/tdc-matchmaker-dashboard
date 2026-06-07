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

  // System Ranking States
  const [isRankedByAI, setIsRankedByAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeModalMatch, setActiveModalMatch] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  
  // Explanation Modal States
  const [selectedMatchForExplanation, setSelectedMatchForExplanation] = useState(null);
  const [selectedMatchScore, setSelectedMatchScore] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const clientData = await api.getCustomerById(customerId);
      const matchesData = await api.getAlgorithmicMatches(customerId);

      const initializedCandidates = matchesData.map(c => ({
        ...c,
        aiScore: null,
        rankLabel: null,
        aiExplanation: null
      }));

      setClient(clientData);
      setJourneyStatus(clientData.journeyStatus);
      setCandidates(initializedCandidates);
      setIsRankedByAI(false);
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

  const executeBulkAIRanking = async () => {
    try {
      setLoadingAI(true);

      const rankingPromises = candidates.map(async (candidate) => {
        try {
          const response = await api.getAIMatchAnalysis({
            clientId: client._id,
            matchId: candidate.profile._id
          });

          let rankExplanation = "Standard Potential Match";
          if (response.compatibilityScore >= 90) rankExplanation = "Elite High-Potential Match";
          else if (response.compatibilityScore >= 80) rankExplanation = "High Potential Match";

          return {
            ...candidate,
            aiScore: response.compatibilityScore,
            rankLabel: rankExplanation,
            aiExplanation: response
          };
        } catch (innerErr) {
          return {
            ...candidate,
            aiScore: "ERR",
            rankLabel: "API Route Fault",
            aiExplanation: { error: true, message: innerErr.message }
          };
        }
      });

      const rankedResult = await Promise.all(rankingPromises);

      // Force high-to-low ranking sort matrix
      rankedResult.sort((a, b) => {
        if (a.aiScore === "ERR") return 1;
        if (b.aiScore === "ERR") return -1;
        return b.aiScore - a.aiScore;
      });

      setCandidates(rankedResult);
      setIsRankedByAI(true);
    } catch (err) {
      console.error("Global Ranking Exception:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleScoreClick = (e, candidate) => {
    e.stopPropagation();
    if (!isRankedByAI || candidate.aiScore === null) return;
    
    setSelectedMatchForExplanation(candidate.profile);
    setSelectedMatchScore(candidate.aiScore);
    setAiAnalysis(candidate.aiExplanation);
  };

  if (loading || !client) {
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
        
        {/* Left Side Client Dossier Sidebar Card */}
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
                
                <div className="col-span-2 border-t border-gray-50 pt-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Cultural Heritage Trace</p><p className="font-bold text-gray-800 text-xs mt-0.5">{client.religion} Religion • {client.caste} Lineage</p></div>

                <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Profession</p><p className="font-medium text-gray-800 truncate">{client.designation} @ {client.company}</p></div>
                <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Education Background</p><p className="font-medium text-gray-800 truncate text-xs">{client.degree}, {client.college}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Dietary Preference</p><p className="font-medium text-gray-800">{client.diet}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Family Core Values</p><p className="font-medium text-gray-800">{client.familyValues}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Open to Relocate</p><p className="font-medium text-gray-800">{client.openToRelocate}</p></div>
                <div><p className="text-[11px] text-gray-400 uppercase font-medium">Open to Pets</p><p className="font-medium text-gray-800">{client.openToPets}</p></div>
                <div className="col-span-2"><p className="text-[11px] text-gray-400 uppercase font-medium">Wants Children</p><p className="font-medium text-gray-800">{client.wantKids}</p></div>
                
                <div className="col-span-2 border-t border-gray-100 pt-3 grid grid-cols-1 gap-y-2">
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Client Email</p><p className="font-medium text-slate-700 break-all text-xs mt-0.5">{client.email}</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Direct Phone / Mobile</p><p className="font-medium text-slate-700 text-xs mt-0.5">{client.phone}</p></div>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateLogs} className="pt-4 space-y-4">
              <button type="submit" disabled={updatingLogs} className="w-full bg-tdc-green text-white text-xs font-semibold py-2.5 rounded-xl">{updatingLogs ? 'Saving updates...' : 'Commit Logs Entry'}</button>
            </form>
          </div>
        </div>

        {/* Right Side Matchmaker Result Queue Stream Layout */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-tdc-dark mb-1 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-tdc-logo-gold" />
                  <span>Algorithmic Matching Pipeline Results</span>
                </h3>
                <p className="text-xs text-gray-400 font-medium">Displaying profiles filtered dynamically across exact cultural and rubric frameworks.</p>
              </div>

              {/* COMPACT GLOWING RADIAN ENGINE ACTION TRIGGER */}
              <button
                onClick={executeBulkAIRanking}
                disabled={loadingAI}
                className="w-full sm:w-auto relative group overflow-hidden rounded-lg p-[1.5px] focus:outline-none transition-all hover:scale-102 active:scale-98 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.55)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-600 rounded-lg animate-pulse opacity-80 blur-xs group-hover:opacity-100 transition-all duration-300" />
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-400 rounded-lg" />
                
                <span className="relative flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-[6px] bg-slate-950 text-white font-black text-[11px] tracking-wide transition-colors group-hover:bg-slate-900/95">
                  <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${loadingAI ? 'animate-spin' : 'animate-bounce'}`} />
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent font-extrabold font-mono tracking-wider">
                    {loadingAI ? 'AI Aligning...' : isRankedByAI ? 'Refresh AI Scores' : 'Find Best Match with AI'}
                  </span>
                </span>
              </button>
            </div>

            {/* Candidate Queue Layout Map */}
            <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
              {candidates.map((candidate) => {
                const match = candidate.profile;
                return (
                  <div key={match._id} className="p-5 border border-gray-100 bg-gray-50/50 rounded-xl flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center group hover:border-gray-200 transition-all">
                    <div onClick={() => setPreviewProfile(match)} className="space-y-2 max-w-md cursor-pointer flex-1">
                      
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="font-serif font-bold text-sm text-tdc-dark group-hover:text-tdc-logo-gold transition-colors">{match.firstName} {match.lastName}</span>
                        <span className="text-xs text-gray-400">({new Date().getFullYear() - new Date(match.dateOfBirth).getFullYear()} Yrs, {match.city})</span>
                        
                        {isRankedByAI && candidate.rankLabel && (
                          <span className={`font-mono font-bold text-[9px] px-2 py-0.5 rounded-md tracking-wider border bg-slate-900 text-tdc-text-gold border-white/10`}>
                            {candidate.rankLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 font-medium">{match.designation} at <span className="font-semibold text-gray-700">{match.company}</span> • {match.income} LPA</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchingCriteria.map((badge, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200 rounded-md px-1.5 py-0.5">✓ {badge}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 w-full sm:w-auto justify-end">
                      {isRankedByAI && (
                        <div 
                          onClick={(e) => handleScoreClick(e, candidate)}
                          className={`p-2.5 rounded-xl text-center shadow-xs transition-all shrink-0 w-16 cursor-pointer border bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800`}
                          title="Click to view full dynamic match matrix reasoning"
                        >
                          <p className="text-[8px] uppercase tracking-wider font-bold font-mono text-amber-600">AI Score</p>
                          <p className="text-sm font-black font-mono tracking-tight">{candidate.aiScore}%</p>
                        </div>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveModalMatch(match); }} 
                        className="text-[11px] font-semibold bg-tdc-green text-white px-3 py-2.5 rounded-xl h-11 flex items-center justify-center space-x-1 hover:bg-opacity-95 transition-all shadow-xs"
                      >
                        <Send className="w-3 h-3" /> <span>Send Match</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* COMPATIBILITY ANALYSIS SCREEN MODAL POPUP CONTAINER */}
      {selectedMatchForExplanation && aiAnalysis && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-slate-950 text-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 relative">
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
              <h4 className="font-serif text-base font-bold text-tdc-text-gold tracking-wide flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Match Logic Compliance Matrix Review</h4>
              <button onClick={() => setSelectedMatchForExplanation(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="sm:col-span-3 flex justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-tdc-logo-gold bg-slate-900 flex items-center justify-center font-mono font-bold text-lg text-tdc-text-gold">{selectedMatchScore}%</div>
                </div>
                <div className="sm:col-span-9 space-y-1">
                  <p className="font-serif text-sm font-bold text-white">Dynamic Audit Evaluation (Candidate: {selectedMatchForExplanation.firstName} {selectedMatchForExplanation.lastName})</p>
                  <p className="text-[11px] text-gray-400">Granular reasoning breakdown scoring profession track metrics, cultural alignments, marital status compatibility, and geographic proximity rules.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                  <p className="font-bold text-emerald-400 text-[10px] uppercase">✦ Compatibility Strengths</p>
                  <ul className="space-y-2.5 text-gray-300 list-none pl-0">
                    {aiAnalysis.strengths.map((s, i) => <li key={i} className="leading-relaxed">• {s}</li>)}
                  </ul>
                </div>
                <div className="space-y-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                  <p className="font-bold text-amber-400 text-[10px] uppercase">▲ Friction Risk Assessment</p>
                  <ul className="space-y-2.5 text-gray-300 list-none pl-0">
                    {aiAnalysis.challenges.map((c, i) => <li key={i} className="leading-relaxed">• {c}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-slate-900/40 shrink-0">
              <button onClick={() => setSelectedMatchForExplanation(null)} className="w-full bg-white/10 text-white border border-white/10 text-xs font-bold py-2.5 rounded-xl transition-all">Close Compliance Breakdown</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Match Overlay Popups */}
      {activeModalMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs"><CheckCircle2 className="w-6 h-6" /></div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-gray-900">Premium Match Email Dispatched!</h3>
              <p className="text-xs text-gray-400 font-medium">A premium discovery dispatch notification has been compiled and emailed to <span className="font-bold text-gray-600">{client.firstName}</span>.</p>
            </div>

            <div className="bg-gray-50 border border-gray-200/60 p-4 rounded-xl text-left text-xs space-y-2 font-medium shadow-2xs">
              <p className="font-bold text-gray-800 border-b border-gray-200/60 pb-1.5 uppercase tracking-wider text-[10px] text-tdc-logo-gold">Suggested Match Profile Information</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Candidate Name:</span> {activeModalMatch.firstName} {activeModalMatch.lastName}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Heritage Alignment:</span> {activeModalMatch.religion} • {activeModalMatch.caste}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Age / Height:</span> {new Date().getFullYear() - new Date(activeModalMatch.dateOfBirth).getFullYear()} Yrs • {activeModalMatch.height} cm</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Professional Track:</span> {activeModalMatch.designation} at {activeModalMatch.company}</p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Financial Bracket:</span> <span className="text-emerald-700 font-bold">{activeModalMatch.income} LPA</span></p>
              <p className="text-gray-600"><span className="text-gray-400 font-normal">Location Hub:</span> {activeModalMatch.city}, India</p>
            </div>

            <button onClick={() => setActiveModalMatch(null)} className="w-full bg-tdc-green text-white text-xs font-semibold py-2.5 rounded-xl">Return to Suite</button>
          </div>
        </div>
      )}

      {/* Structural Profile Preview Dossier Overlay */}
      {previewProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 relative">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-tdc-cream text-tdc-logo-gold flex items-center justify-center font-serif font-bold text-sm">{previewProfile.firstName[0]}</div>
                <div>
                  <h4 className="font-serif text-base font-bold text-tdc-dark">{previewProfile.firstName} {previewProfile.lastName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Comprehensive Candidate Dossier</p>
                </div>
              </div>
              <button onClick={() => setPreviewProfile(null)} className="text-gray-400 hover:text-gray-600 p-1.5 bg-gray-50 rounded-lg border border-gray-200/50"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Marital Status</p><p className="font-semibold text-gray-800 text-sm mt-0.5">{previewProfile.maritalStatus}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Income Level</p><p className="font-bold text-emerald-700 text-sm mt-0.5">{previewProfile.income} LPA</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Current Location</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.city}, {previewProfile.country || 'India'}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Open to Relocate</p><p className="font-medium text-gray-700 mt-0.5">{previewProfile.openToRelocate}</p></div>

                <div className="col-span-2 border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Professional Track</p><p className="font-semibold text-gray-800 mt-0.5">{previewProfile.designation}</p><p className="text-gray-500 font-medium">{previewProfile.company}</p></div>
                <div className="col-span-2 border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Academic Credentials</p><p className="font-semibold text-gray-800 mt-0.5">{previewProfile.degree}</p><p className="text-gray-500 text-[11px] font-medium">{previewProfile.college}</p></div>

                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Age / Height Dimensions</p><p className="font-medium text-gray-700 mt-0.5">{new Date().getFullYear() - new Date(previewProfile.dateOfBirth).getFullYear()} Yrs • {previewProfile.height} cm</p></div>
                <div className="border-t border-gray-200/50 pt-2"><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cultural Background Identity</p><p className="font-bold text-amber-800 mt-0.5">{previewProfile.religion} ({previewProfile.caste})</p></div>

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