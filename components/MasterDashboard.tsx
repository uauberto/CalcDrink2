import React, { useState, useEffect } from 'react';
import type { Company } from '../types.ts';
import { api } from '../lib/supabase.ts';
import { Shield, LogOut, CheckCircle, XCircle, Search, Building2, User, LayoutDashboard, Unlock, KeyRound, X, Mail, Phone, CreditCard, RefreshCw, Copy, Filter, Users, AlertTriangle, Settings, DollarSign, Save } from 'lucide-react';

interface MasterDashboardProps {
    adminUser: Company;
    onLogout: () => void;
    onSwitchToApp: () => void;
}

// --- CUSTOM MODAL COMPONENTS ---

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-500/20 p-2 rounded-full">
                        <AlertTriangle className="text-orange-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <p className="text-gray-300 mb-8 leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        disabled={isLoading} 
                        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold shadow-lg shadow-orange-900/30 flex items-center gap-2"
                    >
                        {isLoading && <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>}
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error';
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, title, message, type = 'success', onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl w-full max-w-sm p-6 text-center">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {type === 'success' ? <CheckCircle size={28} /> : <XCircle size={28} />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-6 text-sm">{message}</p>
                <button 
                    onClick={onClose} 
                    className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const MasterDashboard: React.FC<MasterDashboardProps> = ({ adminUser, onLogout, onSwitchToApp }) => {
    const [activeTab, setActiveTab] = useState<'companies' | 'settings'>('companies');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'active' | 'suspended' | 'waiting_payment'>('all');
    
    // Settings State
    const [config, setConfig] = useState({
        prices: { monthly: 49.90, yearly: 39.90 },
        googlePay: { merchantName: '', merchantId: '', gateway: '', gatewayMerchantId: '' }
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // Modal States
    const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void;}>({
        isOpen: false, title: '', message: '', onConfirm: () => {} 
    });
    const [alertDialog, setAlertDialog] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'}>({
        isOpen: false, title: '', message: '', type: 'success'
    });
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Password Reset State
    const [resetPasswordModal, setResetPasswordModal] = useState<{isOpen: boolean, companyId: string, email: string} | null>(null);
    const [manualPassword, setManualPassword] = useState('');

    // User Management Modal State
    const [managingUsersCompany, setManagingUsersCompany] = useState<Company | null>(null);

    useEffect(() => {
        if (activeTab === 'companies') loadCompanies();
        if (activeTab === 'settings') loadSettings();
    }, [activeTab]);

    const loadCompanies = async () => {
        setIsLoading(true);
        const data = await api.admin.listAllCompanies();
        setCompanies(data);
        setIsLoading(false);
    };

    const loadSettings = async () => {
        setIsLoading(true);
        const data = await api.system.getConfig();
        setConfig(data);
        setIsLoading(false);
    }

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        const success = await api.system.saveConfig(config);
        setSavingSettings(false);
        if (success) {
            showAlert("Sucesso", "Configurações atualizadas!", 'success');
        } else {
            showAlert("Erro", "Falha ao salvar configurações.", 'error');
        }
    };

    const generateRandomPassword = () => Math.random().toString(36).slice(-8).toUpperCase();

    const openResetModal = (company: Company) => {
        setManualPassword(generateRandomPassword());
        setResetPasswordModal({ isOpen: true, companyId: company.id, email: company.email });
    };

    const showAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setAlertDialog({ isOpen: true, title, message, type });
    };

    // --- ACTIONS ---

    const initiateUpdateStatus = (id: string, newStatus: Company['status']) => {
        let title = "Alterar Status";
        let message = "Deseja realmente alterar o status desta empresa?";

        switch (newStatus) {
            case 'active':
                title = "Liberar Acesso";
                message = "Esta ação concederá acesso total à plataforma para a empresa, ignorando a verificação de pagamento. Deseja continuar?";
                break;
            case 'suspended':
                title = "Suspender Empresa";
                message = "O usuário perderá o acesso à plataforma imediatamente. Tem certeza?";
                break;
            case 'waiting_payment':
                title = "Aprovar Cadastro";
                message = "O cadastro será aprovado e o usuário poderá prosseguir para a tela de pagamento.";
                break;
        }

        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: () => executeUpdateStatus(id, newStatus)
        });
    };

    const executeUpdateStatus = async (id: string, newStatus: Company['status']) => {
        setIsActionLoading(true);
        const success = await api.admin.updateCompanyStatus(id, newStatus);
        setIsActionLoading(false);
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        if (success) {
            setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            if (managingUsersCompany && managingUsersCompany.id === id) {
                setManagingUsersCompany(prev => prev ? { ...prev, status: newStatus } : null);
            }
            showAlert("Sucesso", "Status atualizado com sucesso!", 'success');
        } else {
            showAlert("Erro", "Falha ao atualizar status. Verifique as permissões.", 'error');
        }
    };

    const initiateRoleChange = (id: string, newRole: string) => {
        const roleName = newRole === 'admin' ? 'Administrador' : newRole === 'manager' ? 'Gerente' : 'Bartender';
        setConfirmDialog({
            isOpen: true,
            title: "Alterar Cargo",
            message: `Deseja alterar o nível de acesso deste usuário para ${roleName.toUpperCase()}?`,
            onConfirm: () => executeRoleChange(id, newRole)
        });
    };

    const executeRoleChange = async (id: string, newRole: string) => {
        setIsActionLoading(true);
        const success = await api.admin.updateCompanyRole(id, newRole);
        setIsActionLoading(false);
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        if (success) {
            setCompanies(prev => prev.map(c => c.id === id ? { ...c, role: newRole as any } : c));
             if (managingUsersCompany && managingUsersCompany.id === id) {
                setManagingUsersCompany(prev => prev ? { ...prev, role: newRole as any } : null);
            }
            showAlert("Sucesso", "Cargo atualizado com sucesso!", 'success');
        } else {
            showAlert("Erro", "Falha ao atualizar cargo.", 'error');
        }
    };

    const handleConfirmResetPassword = async () => {
        if (!resetPasswordModal || !manualPassword) return;
        
        if (manualPassword.length < 4) {
            showAlert("Senha Curta", "A senha deve ter pelo menos 4 caracteres.", 'error');
            return;
        }

        setIsActionLoading(true);
        const success = await api.admin.resetUserPassword(resetPasswordModal.companyId, manualPassword);
        setIsActionLoading(false);
        
        if (success) {
            setResetPasswordModal(null);
            
            setConfirmDialog({
                isOpen: true,
                title: "Senha Redefinida",
                message: "A senha foi salva com sucesso. Deseja abrir o cliente de e-mail para enviar a nova senha ao usuário?",
                onConfirm: () => {
                     const subject = encodeURIComponent("Redefinição de Senha - CalculaDrink");
                     const body = encodeURIComponent(`Olá,\n\nSua senha foi redefinida pelo administrador.\n\nNova Senha: ${manualPassword}\n\nAcesse em: https://uauberto.github.io/CalculaDrink/\n\nAtenciosamente,\nEquipe CalculaDrink`);
                     window.location.href = `mailto:${resetPasswordModal.email}?subject=${subject}&body=${body}`;
                     setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            });
            setManualPassword('');
        } else {
            showAlert("Erro", "Erro ao salvar senha no banco de dados.", 'error');
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(manualPassword);
        showAlert("Copiado", "Senha copiada para a área de transferência!");
    }

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.document.includes(searchTerm);
        
        if (filterStatus === 'all') return matchesSearch;
        return matchesSearch && c.status === filterStatus;
    });

    const counts = {
        all: companies.length,
        pending: companies.filter(c => c.status === 'pending_approval').length,
        payment: companies.filter(c => c.status === 'waiting_payment').length,
        active: companies.filter(c => c.status === 'active').length,
        suspended: companies.filter(c => c.status === 'suspended').length,
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'active': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30">ATIVO</span>;
            case 'pending_approval': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold border border-yellow-500/30">PENDENTE</span>;
            case 'waiting_payment': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold border border-blue-500/30">AGUARD. PAGTO</span>;
            case 'suspended': return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">SUSPENSO</span>;
            default: return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-bold border border-gray-500/30">{status}</span>;
        }
    };

    const ActionButtons = ({ company }: { company: Company }) => (
        <div className="flex items-center justify-end gap-2">
             <button 
                onClick={() => setManagingUsersCompany(company)}
                className="p-2 bg-gray-700 text-gray-300 hover:bg-orange-500 hover:text-white rounded-lg transition-colors text-xs font-bold"
                title="Gerenciar Usuários"
            >
                <Users size={16} />
            </button>

            <button 
                onClick={() => openResetModal(company)}
                className="p-2 bg-gray-600/30 text-gray-300 hover:bg-orange-500 hover:text-white rounded-lg transition-colors text-xs font-bold"
                title="Redefinir Senha"
            >
                <KeyRound size={16} />
            </button>

            {company.status === 'pending_approval' && (
                <button 
                    onClick={() => initiateUpdateStatus(company.id, 'waiting_payment')}
                    className="p-2 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                    title="Aprovar Cadastro"
                >
                    <CheckCircle size={16} />
                </button>
            )}

            {(company.status === 'pending_approval' || company.status === 'waiting_payment' || company.status === 'suspended') && (
                <button 
                    onClick={() => initiateUpdateStatus(company.id, 'active')}
                    className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                    title="Liberar Acesso Manualmente"
                >
                    <Unlock size={16} />
                </button>
            )}

            {company.status === 'active' && (
                <button 
                    onClick={() => initiateUpdateStatus(company.id, 'suspended')}
                    className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                    title="Suspender Acesso"
                >
                    <XCircle size={16} />
                </button>
            )}
        </div>
    );

    const FilterTab = ({ id, label, count, isActive }: { id: string, label: string, count: number, isActive: boolean }) => (
        <button 
            onClick={() => setFilterStatus(id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isActive 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {label}
            {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-900 text-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-900 font-sans">
             {/* GLOBAL MODALS */}
             <ConfirmModal 
                isOpen={confirmDialog.isOpen} 
                title={confirmDialog.title} 
                message={confirmDialog.message} 
                onConfirm={confirmDialog.onConfirm} 
                onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})}
                isLoading={isActionLoading}
            />
            <AlertModal
                isOpen={alertDialog.isOpen}
                title={alertDialog.title}
                message={alertDialog.message}
                type={alertDialog.type}
                onClose={() => setAlertDialog({...alertDialog, isOpen: false})}
            />

            <header className="bg-gray-800 shadow-lg border-b border-orange-600/30 sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-600 p-2 rounded-lg">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wider hidden sm:block">Master Admin</h1>
                             <h1 className="text-xl font-bold text-white tracking-wider sm:hidden">Admin</h1>
                            <p className="text-xs text-orange-400 font-medium hidden sm:block">Gestão da Plataforma</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button 
                            onClick={onSwitchToApp} 
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-lg shadow-orange-900/20 hover:shadow-orange-600/40 text-sm font-bold transform active:scale-95"
                        >
                            <LayoutDashboard size={18} />
                            <span className="hidden md:inline">Acessar Meu Sistema</span>
                        </button>
                        <button 
                            onClick={onLogout} 
                            className="flex items-center gap-2 p-2 sm:px-3 text-gray-400 hover:text-white transition-colors text-sm border border-gray-700 hover:bg-gray-700 rounded-lg"
                        >
                            <LogOut size={18} /> <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6">
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('companies')} 
                        className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'companies' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Empresas
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')} 
                        className={`pb-2 px-4 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={16}/> Configurações
                    </button>
                </div>

                {activeTab === 'companies' ? (
                    <>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                            <div className="w-full lg:w-auto">
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Empresas Cadastradas</h2>
                                <p className="text-gray-400 text-sm">Gerencie acessos e permissões</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar empresa..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <button 
                                    onClick={loadCompanies}
                                    className="p-2.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
                                    title="Atualizar Lista"
                                >
                                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                            <FilterTab id="all" label="Todos" count={counts.all} isActive={filterStatus === 'all'} />
                            <FilterTab id="pending_approval" label="Pendentes" count={counts.pending} isActive={filterStatus === 'pending_approval'} />
                            <FilterTab id="waiting_payment" label="Pagamento" count={counts.payment} isActive={filterStatus === 'waiting_payment'} />
                            <FilterTab id="active" label="Ativos" count={counts.active} isActive={filterStatus === 'active'} />
                            <FilterTab id="suspended" label="Suspensos" count={counts.suspended} isActive={filterStatus === 'suspended'} />
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                            </div>
                        ) : (
                            <>
                                {/* MOBILE CARD VIEW */}
                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {filteredCompanies.length === 0 && (
                                        <div className="text-center py-10 bg-gray-800 rounded-xl border border-gray-700">
                                            <Filter className="mx-auto text-gray-600 mb-2" size={32} />
                                            <p className="text-gray-400">Nenhuma empresa encontrada.</p>
                                        </div>
                                    )}
                                    {filteredCompanies.map(company => (
                                        <div key={company.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 shadow-md">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${company.type === 'PJ' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {company.type === 'PJ' ? <Building2 size={20} /> : <User size={20} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">{company.name}</h3>
                                                        <p className="text-xs text-gray-400">{company.responsibleName}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={company.status} />
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-300 mb-4 bg-gray-900/30 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Mail size={14} className="text-gray-500 shrink-0"/>
                                                    <span className="truncate">{company.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-gray-500 shrink-0"/>
                                                    <span>{company.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard size={14} className="text-gray-500 shrink-0"/>
                                                    <span className="capitalize">{company.plan || 'Sem plano'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-700">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Cargo</label>
                                                    <select
                                                        value={company.role}
                                                        onChange={(e) => initiateRoleChange(company.id, e.target.value)}
                                                        className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:border-orange-500 focus:outline-none"
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="bartender">Bartender</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1 text-right">Ações</label>
                                                    <ActionButtons company={company} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* DESKTOP TABLE VIEW */}
                                <div className="hidden md:block bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-900/50 border-b border-gray-700">
                                                <tr>
                                                    <th className="p-4 text-gray-400 font-medium text-sm">Empresa / Responsável</th>
                                                    <th className="p-4 text-gray-400 font-medium text-sm">Contato</th>
                                                    <th className="p-4 text-gray-400 font-medium text-sm">Status</th>
                                                    <th className="p-4 text-gray-400 font-medium text-sm">Cargo / Role</th>
                                                    <th className="p-4 text-gray-400 font-medium text-sm">Plano</th>
                                                    <th className="p-4 text-gray-400 font-medium text-sm text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {filteredCompanies.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                                            Nenhuma empresa encontrada.
                                                        </td>
                                                    </tr>
                                                )}
                                                {filteredCompanies.map(company => (
                                                    <tr key={company.id} className="hover:bg-gray-700/30 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${company.type === 'PJ' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                                    {company.type === 'PJ' ? <Building2 size={18} /> : <User size={18} />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white">{company.name}</p>
                                                                    <p className="text-xs text-gray-400">{company.responsibleName}</p>
                                                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{company.document}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="text-sm text-gray-300">{company.email}</p>
                                                            <p className="text-xs text-gray-500">{company.phone}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <StatusBadge status={company.status} />
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                value={company.role}
                                                                onChange={(e) => initiateRoleChange(company.id, e.target.value)}
                                                                className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 focus:border-orange-500 focus:outline-none"
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="manager">Manager</option>
                                                                <option value="bartender">Bartender</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm text-gray-300 capitalize">{company.plan || '-'}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <ActionButtons company={company} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Seção de Preços */}
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <DollarSign className="text-green-400"/> Configuração de Preços (Planos)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor do Plano Mensal (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">R$</span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={config.prices.monthly}
                                            onChange={e => setConfig({ ...config, prices: { ...config.prices, monthly: parseFloat(e.target.value) } })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor do Plano Anual (Mensalidade eq.) (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">R$</span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={config.prices.yearly}
                                            onChange={e => setConfig({ ...config, prices: { ...config.prices, yearly: parseFloat(e.target.value) } })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-orange-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Total Anual: R$ {(config.prices.yearly * 12).toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção Google Pay */}
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard className="text-blue-400"/> Configuração de Pagamento (Google Pay)
                            </h3>
                            <p className="text-sm text-gray-400 mb-6 bg-gray-900 p-3 rounded-lg border border-gray-700">
                                Estas configurações são usadas para inicializar o cliente do Google Pay. Para produção, certifique-se de obter o Merchant ID correto com seu gateway (Stripe, Adyen, etc.).
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Merchant Name</label>
                                    <input 
                                        type="text"
                                        value={config.googlePay.merchantName}
                                        onChange={e => setConfig({ ...config, googlePay: { ...config.googlePay, merchantName: e.target.value } })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                                        placeholder="Ex: CalculaDrink Ltda"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Google Merchant ID</label>
                                    <input 
                                        type="text"
                                        value={config.googlePay.merchantId}
                                        onChange={e => setConfig({ ...config, googlePay: { ...config.googlePay, merchantId: e.target.value } })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                                        placeholder="ID numérico fornecido pelo Google"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Gateway Name</label>
                                    <input 
                                        type="text"
                                        value={config.googlePay.gateway}
                                        onChange={e => setConfig({ ...config, googlePay: { ...config.googlePay, gateway: e.target.value } })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                                        placeholder="Ex: stripe, adyen, example"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Gateway Merchant ID</label>
                                    <input 
                                        type="text"
                                        value={config.googlePay.gatewayMerchantId}
                                        onChange={e => setConfig({ ...config, googlePay: { ...config.googlePay, gatewayMerchantId: e.target.value } })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-orange-500 focus:outline-none"
                                        placeholder="ID fornecido pelo Gateway"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
                        >
                            {savingSettings ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Save size={22} />}
                            Salvar Todas as Alterações
                        </button>
                    </div>
                )}
            </main>

             {/* Modal de Gerenciamento de Usuários */}
             {managingUsersCompany && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="text-orange-500" />
                                    Usuários Cadastrados
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Empresa: <span className="text-white font-semibold">{managingUsersCompany.name}</span></p>
                            </div>
                            <button onClick={() => setManagingUsersCompany(null)} className="text-gray-400 hover:text-white transition-colors bg-gray-700/50 p-2 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800 border-b border-gray-700 text-xs uppercase text-gray-500 font-semibold">
                                        <tr>
                                            <th className="p-4">Usuário</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Cargo</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        <tr>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-500 flex items-center justify-center font-bold text-xs">
                                                        {managingUsersCompany.responsibleName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{managingUsersCompany.responsibleName}</p>
                                                        <p className="text-xs text-gray-500">Titular</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                 <p className="text-sm text-gray-300">{managingUsersCompany.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={managingUsersCompany.role}
                                                    onChange={(e) => initiateRoleChange(managingUsersCompany.id, e.target.value)}
                                                    className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 border border-gray-600 focus:border-orange-500 focus:outline-none w-full"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="bartender">Bartender</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={managingUsersCompany.status} />
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {managingUsersCompany.status === 'active' ? (
                                                        <button 
                                                            onClick={() => initiateUpdateStatus(managingUsersCompany.id, 'suspended')}
                                                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors text-xs border border-red-500/20"
                                                            title="Suspender"
                                                        >
                                                            Suspender
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => initiateUpdateStatus(managingUsersCompany.id, 'active')}
                                                            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors text-xs border border-green-500/20"
                                                            title="Ativar"
                                                        >
                                                            Ativar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Redefinição de Senha */}
            {resetPasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <KeyRound className="text-orange-500" />
                                Redefinir Senha
                            </h3>
                            <button onClick={() => setResetPasswordModal(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-gray-300">
                                Defina a nova senha para <strong>{resetPasswordModal.email}</strong>:
                            </p>
                            
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        value={manualPassword}
                                        onChange={(e) => setManualPassword(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-lg tracking-wider"
                                        placeholder="Digite a nova senha"
                                    />
                                </div>
                                <button 
                                    onClick={() => setManualPassword(generateRandomPassword())}
                                    className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                                    title="Gerar Senha Aleatória"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button 
                                    onClick={copyToClipboard}
                                    className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                                    title="Copiar Senha"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button 
                                    onClick={() => setResetPasswordModal(null)} 
                                    className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleConfirmResetPassword} 
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    Salvar Senha
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDashboard;