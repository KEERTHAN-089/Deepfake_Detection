export default function SignupGlassy() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-black">

      {/* CENTER GLASS CARD */}
      <div className="
        w-[350px]
        bg-white/10
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        p-8
        shadow-[0_0_40px_rgba(0,0,0,0.5)]
      ">

        <h1 className="text-center text-white text-xl font-semibold">
          Create Account
        </h1>

        <p className="text-center text-gray-400 text-xs mt-1">
          Join us today
        </p>

        <form className="mt-6 space-y-4">

          <div>
            <label className="text-gray-300 text-xs">Full Name</label>
            <input
              className="mt-1 w-full px-3 py-2 bg-black/30 text-white border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="John Carter"
            />
          </div>

          <div>
            <label className="text-gray-300 text-xs">Email</label>
            <input
              className="mt-1 w-full px-3 py-2 bg-black/30 text-white border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-gray-300 text-xs">Password</label>
            <input
              className="mt-1 w-full px-3 py-2 bg-black/30 text-white border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-[0_4px_20px_rgba(0,122,255,0.35)]"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          Already have an account?
          <a href="/login" className="text-blue-400 ml-1">Login</a>
        </p>

      </div>
    </div>
  );
}
