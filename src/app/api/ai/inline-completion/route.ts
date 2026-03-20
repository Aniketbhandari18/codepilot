import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { auth } from "@clerk/nextjs/server";

const reqBodySchema = z.object({
  fileName: z.string().min(1),
  previousLines: z.string(),
  textBeforeCursor: z.string(),
  textAfterCursor: z.string(),
  nextLines: z.string(),
});

const systemMessage = `
You are an INLINE code completion engine (like GitHub Copilot).

Your task is to complete code at the cursor position.

<rules>
- Complete ONLY what is required at the cursor position
- You MAY return multiple lines if needed to form a valid and properly formatted block
- ALWAYS use proper multiline formatting for blocks and multiple statements
- text_after_cursor being empty means cursor is at the end of line, so always use newline for new block or statement
- DO NOT re-define or repeat functions, components, or variables already present in the code
</rules>

<examples>
<full_example>
<previous_lines>export default function TaskList({ spaceId }: { spaceId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

</previous_lines>
<current_line>
<text_before_cursor>  use</text_before_cursor>
<text_after_cursor></text_after_cursor>
</current_line>
<next_lines>  return (
    <div>TaskList</div>
  )
}
export default TaskList;</next_lines>
<output>Effect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(\`/api/spaces/\${spaceId}/tasks\`);
        console.log(res);

        setTasks(res.data.tasks);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [spaceId]);</output>
</full_example>

<example>
<text_before_cursor>    if (!name.trim()) return;</text_before_cursor>
<text_after_cursor></text_after_cursor>

<assumption>
- the "if" block in "text_before_cursor" is already inside nested blocks of 2 tabs(tabSize = 2)
</assumption>
<bad_output> createTask({ name, parentId: creatingTask.parentId, spaceId, priority: creatingTask.priority }); setCreatingTask(null);</bad_output>
<bad_output>createTask({
    name: name,
    spaceId: spaceId,
    parentId: creatingTask.parentId,
    priority: creatingTask.priority,
  });
  setCreatingTask(null);</bad_output>
<good_output>

    createTask({
      name: name,
      spaceId: spaceId,
      parentId: creatingTask.parentId,
      priority: creatingTask.priority,
    });

    setCreatingTask(null);</good_output>

<good_output_explaination>
- output starts with a new line or blank line to separate from previous code
- uses multiline formatting for multiple statements or blocks.
- does not repeat the code already present in the line (like "if (!name.trim()) return;")
</good_output_explaination>
</example>

<example>
<previous_lines>const handleCreate = (name: string) => {</previous_lines>
<text_before_cursor>  </text_before_cursor>
<text_after_cursor></text_after_cursor>
<next_lines>  createTask({
    name: name,
    spaceId: spaceId,
    parentId: creatingTask.parentId,
    priority: creatingTask.priority,
  });

  setCreatingTask(null);</next_lines>
<bad_output>  if (!name) return;</bad_output>
<good_output>if (!name) return;
  
</good_output>

<bad_output_reason>
- it has indentation which is already present in text_before_cursor, so it will cause extra indentation when inserted
</bad_output_reason>
</example>
</examples>
`;

const getSuggestionPrompt = (
  fileName: string,
  previousLines: string,
  textBeforeCursor: string,
  textAfterCursor: string,
  nextLines: string,
) => {
  return `<context>
<metadata>
<file_name>${fileName}</file_name>
</metadata>
<code>
<previous_lines>${previousLines}</previous_lines>
<currentLine>
<text_before_cursor>${textBeforeCursor}</text_before_cursor>
<text_after_cursor>${textAfterCursor}</text_after_cursor>
</current_line>
<next_lines>${nextLines}</next_lines>
</code>
</context>

Based on the context above, return the completion text to insert at the cursor.
`;
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const parsed = reqBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const {
      fileName,
      previousLines,
      textBeforeCursor,
      textAfterCursor,
      nextLines,
    } = parsed.data;

    const { output } = await generateText({
      model: google("gemini-3.1-flash-lite-preview"),
      output: Output.object({
        schema: z.object({
          suggestion: z.string(),
        }),
      }),
      system: systemMessage,
      prompt: getSuggestionPrompt(
        fileName,
        previousLines,
        textBeforeCursor,
        textAfterCursor,
        nextLines,
      ),
      temperature: 0,
      abortSignal: req.signal,
    });

    return NextResponse.json({
      suggestion: output.suggestion,
    });
  } catch (error) {
    // Handle abort errors separately to avoid logging them as actual errors
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "ResponseAborted")
    ) {
      return NextResponse.json({ suggestion: "" });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
