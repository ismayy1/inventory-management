export default function DebugPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
            <p>If you can see this page, the basic routing is working.</p>
            <div className="mt-4 space-y-2">
                <p>Background color should be dark</p>
                <p>Text should be light</p>
                <p>This confirms CSS is loading</p>
            </div>
        </div>
    )
}