
import React, { useState, useEffect } from 'react';
import type { Company, TeamUser, UserRole } from '../types.ts';
import { api } from '../lib/supabase.ts';
import { Users, Plus, Trash2, Shield, User, Loader2, Save, X } from 'lucide-react';

interface TeamManagerProps {
    company: Company;
}

const TeamManager: React.FC<TeamManagerProps> = ({ company }) => {
    const [team, setTeam] = useState<TeamUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'bartender' as UserRole, password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        setIsLoading(true);
        const data = await api.team.list(company.id);
        setTeam(data);
        setIsLoading(false);
    };

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Preencha todos os campos");
            return;
        }
        
        setIsSubmitting(true);
        const success = await api.team.add({
            companyId: company.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }, newUser.password);
        setIsSubmitting(false);

        if (success) {
            alert("Usuário adicionado com sucesso!");
            setShowAddModal(false);
            setNewUser({ name: '', email: '', role: 'bartender', password: '' });
            loadTeam();
        } else {
            alert("Erro ao adicionar usuário. Verifique se o email já existe.");
        }
    };

    const handleRemoveUser = async (id: string) => {
        if (confirm("Tem certeza que deseja remover este usuário? Ele perderá o acesso imediatamente.")) {
            const success = await api.team.remove(id);
            if (success) {
                setTeam(team.filter(u => u.id !== id));
            } else {
                alert("Erro ao remover usuário.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                    <Users /> Gestão de Equipe
                </h2>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-md transition-colors"
                >
                    <Plus size={18} /> Adicionar Membro
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 border-b border-gray-700">
                                <tr>
                                    <th className="p-4 font-medium text-gray-400">Nome</th>
                                    <th className="p-4 font-medium text-gray-400">Email (Login)</th>
                                    <th className="p-4 font-medium text-gray-400">Cargo</th>
                                    <th className="p-4 font-medium text-gray-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {team.length === 0 ? (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum membro na equipe ainda.</td></tr>
                                ) : (
                                    team.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-700/30">
                                            <td className="p-4 text-white font-medium flex items-center gap-2">
                                                <div className="bg-gray-700 p-1.5 rounded-full"><User size={14}/></div>
                                                {user.name}
                                            </td>
                                            <td className="p-4 text-gray-300">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded transition-colors"
                                                    title="Remover Acesso"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Novo Membro</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                                <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email (Login)</label>
                                <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Senha de Acesso</label>
                                <input type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none" placeholder="Defina uma senha inicial" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Cargo</label>
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none">
                                    <option value="bartender">Bartender (Operacional)</option>
                                    <option value="manager">Gerente (Acesso Total)</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleAddUser} 
                                disabled={isSubmitting}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
