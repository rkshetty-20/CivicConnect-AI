import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import API from '../../services/api';
import { Loader2, AlertCircle, Award, Trophy, Star } from 'lucide-react';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await API.get('/users/leaderboard');
        setUsers(res.data);
      } catch (err) {
        setError('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const renderBadge = (points) => {
    if (points >= 500) return <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold border border-purple-500/30">Platinum</span>;
    if (points >= 200) return <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/30">Gold</span>;
    if (points >= 50) return <span className="bg-slate-300/20 text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-300/30">Silver</span>;
    return <span className="bg-orange-800/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold border border-orange-800/30">Bronze</span>;
  };

  const getPodiumColor = (index) => {
    if (index === 0) return 'text-amber-400 bg-amber-400/10 border-amber-400/20'; // Gold
    if (index === 1) return 'text-slate-300 bg-slate-300/10 border-slate-300/20'; // Silver
    if (index === 2) return 'text-orange-400 bg-orange-400/10 border-orange-400/20'; // Bronze
    return 'text-slate-400 bg-slate-800/50 border-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Civic Leaderboard</h1>
          <p className="text-slate-400 text-lg">Top citizens making a difference in the community.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => {
              const isPodium = index < 3;
              const podiumClass = getPodiumColor(index);

              return (
                <div
                  key={user._id}
                  className={`flex items-center p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01] ${podiumClass}`}
                >
                  <div className="flex items-center justify-center w-10 h-10 font-black text-xl mr-4">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold truncate ${isPodium ? 'text-lg' : 'text-base'}`}>
                      {user.name}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5" />
                        <span>{user.reputationPoints} Points</span>
                      </span>
                      <span>•</span>
                      {renderBadge(user.reputationPoints)}
                    </div>
                  </div>
                  
                  {isPodium && (
                    <Award className="w-8 h-8 opacity-20 hidden sm:block" />
                  )}
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center text-slate-500 py-10">
                No users found. Start reporting issues to earn points!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;
