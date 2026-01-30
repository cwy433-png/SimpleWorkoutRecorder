import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const UserProfile = () => {
    const [profile, setProfile] = useState({
        name: '',
        age: '',
        weight: '',
        height: '',
        experience: 'intermediate', // beginner, intermediate, advanced
        goals: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
            setProfile(JSON.parse(saved));
        } else {
            setIsEditing(true); // Auto-edit if no profile
        }
    }, []);

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        localStorage.setItem('user_profile', JSON.stringify(profile));
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card className="glass border border-white/10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-black italic uppercase text-white mb-6">Your Profile</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Name</label>
                            <input
                                className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none"
                                value={profile.name}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Lifter"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Age</label>
                            <input
                                type="number"
                                className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none"
                                value={profile.age}
                                onChange={e => handleChange('age', e.target.value)}
                                placeholder="25"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none"
                                value={profile.weight}
                                onChange={e => handleChange('weight', e.target.value)}
                                placeholder="75"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Height (cm)</label>
                            <input
                                type="number"
                                className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none"
                                value={profile.height}
                                onChange={e => handleChange('height', e.target.value)}
                                placeholder="175"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Experience Level</label>
                        <select
                            className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none appearance-none"
                            value={profile.experience}
                            onChange={e => handleChange('experience', e.target.value)}
                        >
                            <option value="beginner">Beginner (0-1 years)</option>
                            <option value="intermediate">Intermediate (1-3 years)</option>
                            <option value="advanced">Advanced (3+ years)</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase mb-1">Primary Goal</label>
                        <input
                            className="bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-primary)] outline-none"
                            value={profile.goals}
                            onChange={e => handleChange('goals', e.target.value)}
                            placeholder="e.g. Increase bench press, Gain muscle"
                        />
                    </div>

                    <Button onClick={handleSave} className="w-full mt-4 font-black italic">
                        SAVE PROFILE
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="glass border border-white/10 p-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-black italic uppercase text-white">{profile.name || 'ATHLETE'}</h3>
                    <p className="text-xs font-bold text-[var(--color-text-muted)] tracking-widest uppercase">{profile.experience} • {profile.weight}kg</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="text-[var(--color-primary)]">
                    Edit
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Height</div>
                    <div className="text-xl font-bold text-white">{profile.height} cm</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Age</div>
                    <div className="text-xl font-bold text-white">{profile.age} yrs</div>
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border-l-2 border-[var(--color-primary)]">
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase">Current Goal</div>
                <div className="text-sm font-bold text-white italic">"{profile.goals || 'Get Stronger'}"</div>
            </div>
        </Card>
    );
};
