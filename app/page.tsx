import Link from "next/link";
export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="text-xl font-semibold">百词斩式闯关</h2>
        <p className="text-sm text-gray-600 mt-2">看单词/听发音 → 选义项 → 即时反馈 → 计分连击。</p>
        <Link href="/play/word-blitz" className="btn btn-primary mt-4 inline-block">开始练习</Link>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold">连词造句</h2>
        <p className="text-sm text-gray-600 mt-2">打乱的词块按正确顺序拼成句子，支持键盘输入。</p>
        <Link href="/learn/sentence-builder" className="btn btn-primary mt-4 inline-block">开始练习</Link>
      </div>
    </div>
  );
}
