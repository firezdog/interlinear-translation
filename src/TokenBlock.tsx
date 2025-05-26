import { Token } from "@/types/passage";

export default function TokenBlock({ token }: { token: Token }) {
    return (
        <div className="py-1 px-1 hover:bg-sky-100 text-center">
            <div>{token.content}</div>
            <div>{token.transliteration}</div>
            <div>{token.translation}</div>
        </div>
    )
}