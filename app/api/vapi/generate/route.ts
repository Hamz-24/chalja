import { NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
};

// ✅ Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("📥 Raw incoming payload from Vapi:");
        console.dir(body, { depth: null });

        // 🧩 1️⃣ Extract values from tool call arguments (most reliable)
        const toolArgs =
            body?.message?.toolCalls?.[0]?.function?.arguments ||
            body?.message?.toolCallList?.[0]?.function?.arguments ||
            {};

        // 🧩 2️⃣ Extract additional variable values (if any)
        const vars =
            body?.message?.assistant?.variableValues ||
            body?.message?.call?.assistantOverrides?.variableValues ||
            body?.variableValues ||
            {};

        // 🧠 3️⃣ Merge everything, giving priority to toolArgs
        const {
            role = toolArgs.role || "unknown",
            type = toolArgs.type || "technical",
            level = toolArgs.level || "junior",
            techstack = toolArgs.techstack || "",
            amount = toolArgs.amount || "5",
            userid =
                toolArgs.userid || vars.userid || body.userid || "anonymous",
            username =
                vars.username || body.username || "Unknown User",
        } = { ...body, ...vars, ...toolArgs };

        console.log("✅ Extracted variables:");
        console.log("   ↳ userid:", userid);
        console.log("   ↳ username:", username);
        console.log("   ↳ role:", role);
        console.log("   ↳ type:", type);
        console.log("   ↳ level:", level);
        console.log("   ↳ techstack:", techstack);
        console.log("   ↳ amount:", amount);

        // 🧠 4️⃣ Generate interview questions with Gemini
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
        Prepare ${amount} interview questions for a ${level}-level ${role} position.
        Focus on ${type} topics.
        Technologies to cover: ${techstack}.
        Return only the questions as a JSON array: ["Question 1", "Question 2", ...]
      `,
        });

        console.log("🧠 Gemini output:", questions);

        // ✅ Safe parse for Gemini output
        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(questions);
        } catch {
            parsedQuestions = questions
                .split(/\n+/)
                .map((q) => q.replace(/^\d+\.?\s*/, "").trim())
                .filter(Boolean);
        }

        // ✅ Create Firestore object
        const interview = {
            role,
            type,
            level,
            techstack:
                typeof techstack === "string"
                    ? techstack.split(",").map((t) => t.trim())
                    : [],
            questions: parsedQuestions,
            userId: userid,
            userName: username,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        console.log("💾 Saving to Firestore:", interview);
        await db.collection("interviews").add(interview);

        return new NextResponse(
            JSON.stringify({ success: true, data: interview }),
            { status: 200, headers: corsHeaders }
        );
    } catch (error: any) {
        console.error("❌ Error in /vapi/generate:", error);
        return new NextResponse(
            JSON.stringify({
                success: false,
                message: "Server crashed",
                error: String(error),
                stack: error?.stack,
            }),
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function GET() {
    return new NextResponse(
        JSON.stringify({
            success: true,
            message: "API is working fine ✅",
        }),
        { status: 200, headers: corsHeaders }
    );
}
