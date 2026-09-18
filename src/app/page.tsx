import CreateBracketForm from '@/components/CreateBracketForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          Showdown Bracket Maker
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Create a multi-tenant tournament bracket, invite your friends, and vote asynchronously to declare the ultimate winner.
        </p>
      </div>

      <CreateBracketForm />
      
    </main>
  );
}
