export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-purple-500/20 backdrop-blur-xl p-6 ${className}`}>
      {children}
    </div>
  );
}
