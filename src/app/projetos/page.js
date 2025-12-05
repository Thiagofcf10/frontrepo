'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjetoCard from '@/components/ProjetoCard';
import api, { fetchWithApiKey } from '@/lib/api';
import { TIPOS_PROJETO } from '@/lib/constants';

export default function ProjetosPage() {
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [selectedAluno, setSelectedAluno] = useState('');
  
  const [professors, setProfessors] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [years, setYears] = useState([]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedType, selectedYear, selectedProfessor, selectedAluno, projetos]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const apiKey = api.getApiKey();
      const apiUrl = api.getApiUrl();

      // Load published projects
      const projetosRes = await fetchWithApiKey(`${apiUrl}/selectprojetos_publicos?api_key=${apiKey}`);
      const projetosData = projetosRes.data || [];
      setProjetos(projetosData);

      // Extract years from projects
      const yearsSet = new Set();
      projetosData.forEach(p => {
        if (p.created_at) {
          const year = new Date(p.created_at).getFullYear();
          yearsSet.add(year);
        }
      });
      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
      setYears(sortedYears);

      // Load professors
      const profsRes = await fetchWithApiKey(`${apiUrl}/selectprofessor?api_key=${apiKey}`);
      const profsData = profsRes.data || [];
      setProfessors(profsData);

      // Load alunos
      const alunosRes = await fetchWithApiKey(`${apiUrl}/selectaluno?api_key=${apiKey}`);
      const alunosData = alunosRes.data || [];
      setAlunos(alunosData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = projetos;

    // Search by title
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome_projeto.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(p => p.tipo_projeto === selectedType);
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(p => {
        if (!p.created_at) return false;
        const projectYear = new Date(p.created_at).getFullYear();
        return projectYear === parseInt(selectedYear);
      });
    }

    // Filter by professor (orientador)
    if (selectedProfessor) {
      filtered = filtered.filter(p => p.orientador === parseInt(selectedProfessor));
    }

    // Filter by aluno: match either by matricula_alunos IDs or by nome_autores (name string)
    if (selectedAluno) {
      const alunoIdStr = String(selectedAluno);
      const alunoObj = alunos.find(a => String(a.id) === alunoIdStr);
      const alunoNome = alunoObj ? (alunoObj.nome_aluno || '').toLowerCase() : null;

      filtered = filtered.filter(p => {
        // check matricula ids
        if (p.matricula_alunos) {
          const alunoIds = String(p.matricula_alunos).split(',').map(id => id.trim());
          if (alunoIds.includes(alunoIdStr)) return true;
        }

        // check nome_autores if present
        if (alunoNome && p.nome_autores) {
          const nomes = String(p.nome_autores).toLowerCase();
          if (nomes.includes(alunoNome)) return true;
        }

        return false;
      });
    }

    setFiltrados(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedYear('');
    setSelectedProfessor('');
    setSelectedAluno('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-sky-50 to-white">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-900 mb-2">Projetos Publicados</h1>
          <p className="text-gray-600">Explore e filtre os projetos acadêmicos do IFPA</p>
        </section>

        {/* Search Bar */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pesquisar por título</label>
            <input
              type="text"
              placeholder="Digite o nome do projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full placeholder-gray-400 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Projeto</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Todos os tipos</option>
                {TIPOS_PROJETO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Filter by Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Todos os anos</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Filter by Professor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Todos os professores</option>
                {professors.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nome_professor || `Prof. ${prof.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Aluno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aluno</label>
              <select
                value={selectedAluno}
                onChange={(e) => setSelectedAluno(e.target.value)}
                className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Todos os alunos</option>
                {alunos.map(aluno => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome_aluno || `Aluno ${aluno.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
              >
                🔄 Limpar Filtros
              </button>
            </div>
          </div>
        </section>

        {/* Results Counter */}
        <section className="mb-6">
          <p className="text-gray-700 font-medium">
            {filtrados.length === 0 
              ? 'Nenhum projeto encontrado' 
              : `${filtrados.length} projeto${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`
            }
          </p>
        </section>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-3xl">⏳ Carregando projetos...</div>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-600 mb-4">Tente ajustar seus filtros ou a busca.</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map(projeto => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}