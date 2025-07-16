import Link from "next/link"

export default function Go() {
    return (
        <div className="flex flex-col m-8 gap-2">
            <Link href="/">
                <div>키오스크</div>
            </Link>
            <Link href="/admin/addscore">
                <div>점수 입력</div>
            </Link>
            <Link href="/speedquiz">
                <div>{'스피드퀴즈(학생용)'}</div>
            </Link>
            <Link href="/admin/speedquiz">
                <div>{'스피드퀴즈(1인 진행)'}</div>
            </Link>
            <Link href="/admin/speedquiz3">
                <div>{'스피드퀴즈(3인 진행)'}</div>
            </Link>
            <Link href="/store">
                <div>{'교환처(학생용)'}</div>
            </Link>
            <Link href="/admin/merchant">
                <div>{'교환처(부원용)'}</div>
            </Link>
            <Link href="/api/rank">
                <div>{'순위'}</div>
            </Link>
        </div>
    )
}