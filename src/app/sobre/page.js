import Navbar from '@/components/Navbar';

export default function SobrePage(){
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-4">Sobre</h1>
            <p className="text-gray-700 mb-4">IFPA Projetos é uma aplicação para gerenciar projetos acadêmicos, registros de reuniões, arquivos e custos associadas aos projetos. Foi desenvolvida para facilitar a gestão por professores e o acompanhamento por alunos.</p>
            <h2 className="text-xl font-semibold mt-6">Objetivo</h2>
            <p className="text-gray-600">Centralizar informações dos projetos, permitir controle de custos, upload de arquivos e comunicação entre membros.</p>
            <h2 className="text-xl font-semibold mt-6">Equipe</h2>
            <p className="text-gray-600">Equipe de desenvolvimento do IFPA tucuruí — repoifpa@gmail.com.br</p>
          </div>
        </div>
      </main>
    </div>
  );
}
