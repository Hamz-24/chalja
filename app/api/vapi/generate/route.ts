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

        // ✅ Extract nested variable values safely (Vapi sends them under message.assistant.variableValues)
        const vars =
            body?.message?.assistant?.variableValues ||
            body?.variableValues ||
            {};

        // 🧠 Extract all params, preferring vars first, with safe defaults
        const {
            type = "technical",
            role = "unknown",
            level = "junior",
            techstack = "",
            amount = "5",
            userid = vars.userid || body.userid || "anonymous",
            username = vars.username || body.username || "Unknown User",
        } = {
            ...body,
            ...vars,
        };

        console.log("✅ Extracted variables:");
        console.log("   ↳ userid:", userid);
        console.log("   ↳ username:", username);
        console.log("   ↳ role:", role);
        console.log("   ↳ type:", type);
        console.log("   ↳ level:", level);
        console.log("   ↳ techstack:", techstack);
        console.log("   ↳ amount:", amount);

        // 🧠 Generate questions
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `
        Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
        Return the questions formatted like this: ["Question 1", "Question 2"]
      `,
        });

        console.log("🧠 Gemini output:", questions);

        // ✅ Safe parse
        let parsedQuestions;
        try {
            parsedQuestions = JSON.parse(questions);
        } catch {
            parsedQuestions = questions
                .split(/\n+/)
                .map((q) => q.replace(/^\d+\.?\s*/, "").trim())
                .filter(Boolean);
        }

        // ✅ Create interview object (safe)
        const interview = {
            role,
            type,
            level,
            techstack: typeof techstack === "string"
                ? techstack.split(",").map((t) => t.trim())
                : [],
            questions: parsedQuestions,
            userId: userid,
            userName: username, // ✅ Added to Firestore for debugging/logging
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
