const XLSX = require("xlsx");
const Question = require("../../models/Question");

/**
 * Generate Excel template based on Question model schema
 * Dynamically creates template with all required fields from the model
 */
const generateTemplate = async (req, res) => {
  try {
    console.log("[BulkQuestion.generateTemplate] Generating Excel template");

    // Create worksheet data as array of arrays
    const worksheetData = [
      // Header row
      [
        "text",
        "topic",
        "option1_text",
        "option1_isCorrect",
        "option2_text",
        "option2_isCorrect",
        "option3_text",
        "option3_isCorrect",
        "option4_text",
        "option4_isCorrect",
        "option5_text",
        "option5_isCorrect",
        "category",
        "subtopic",
        "difficulty",
        "tags",
        "details",
      ],
      // Instructions row
      [
        "[REQUIRED] Question text",
        "[REQUIRED] Topic from request (e.g., Arrays, Algebra)",
        "[REQUIRED] At least 2 options needed",
        "true/false - At least one must be true",
        "[REQUIRED]",
        "true/false",
        "[OPTIONAL] Add more options as needed",
        "true/false",
        "[OPTIONAL]",
        "true/false",
        "[OPTIONAL]",
        "true/false",
        "[REQUIRED] aptitude/technical/psychometric",
        "[REQUIRED] Subtopic name",
        "[REQUIRED] easy/medium/hard",
        "[OPTIONAL] Comma-separated tags",
        "[OPTIONAL] Additional explanation",
      ],
      // Sample data row
      [
        "What is 2 + 2?",
        "Mathematics",
        "3",
        "false",
        "4",
        "true",
        "5",
        "false",
        "6",
        "false",
        "",
        "",
        "aptitude",
        "Basic Arithmetic",
        "easy",
        "arithmetic, basic",
        "Basic addition question",
      ],
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 50 }, // text
      { wch: 25 }, // topic
      { wch: 30 }, // option1_text
      { wch: 15 }, // option1_isCorrect
      { wch: 30 }, // option2_text
      { wch: 15 }, // option2_isCorrect
      { wch: 30 }, // option3_text
      { wch: 15 }, // option3_isCorrect
      { wch: 30 }, // option4_text
      { wch: 15 }, // option4_isCorrect
      { wch: 30 }, // option5_text
      { wch: 15 }, // option5_isCorrect
      { wch: 20 }, // category
      { wch: 20 }, // subtopic
      { wch: 15 }, // difficulty
      { wch: 30 }, // tags
      { wch: 40 }, // details
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    // Generate binary string and convert to Buffer (more robust across environments)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=question_template.xlsx"
    );
    res.setHeader("Content-Length", excelBuffer.length);

    console.log(
      "[BulkQuestion.generateTemplate] ✓ Template generated successfully"
    );
    return res.end(excelBuffer);
  } catch (err) {
    console.error("[BulkQuestion.generateTemplate] ✗ Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Parse uploaded Excel file and validate questions
 * Returns parsed questions array with validation results
 */
const parseUploadedFile = async (req, res) => {
  try {
    console.log("[BulkQuestion.parseUploadedFile] Parsing uploaded file");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileBuffer = req.file.buffer;
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or has no valid data rows",
      });
    }

    // Filter out instruction rows (rows that contain [REQUIRED] or [OPTIONAL])
    const dataRows = rawData.filter((row) => {
      const textValue = String(row.text || "").trim();
      return (
        textValue &&
        !textValue.includes("[REQUIRED]") &&
        !textValue.includes("[OPTIONAL]")
      );
    });

    if (dataRows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid question data found in file. Please ensure you add questions below the sample row.",
      });
    }

    console.log(
      `[BulkQuestion.parseUploadedFile] Found ${dataRows.length} data rows`
    );

    const parsedQuestions = [];
    const errors = [];

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 1; // For user-friendly error messages

      try {
        // Validate required fields
        const text = String(row.text || "").trim();
        if (!text) {
          errors.push({
            row: rowNum,
            field: "text",
            message: "Question text is required",
          });
          continue;
        }

        const topic = String(row.topic || "").trim();
        if (!topic) {
          errors.push({
            row: rowNum,
            field: "topic",
            message: "Topic is required",
          });
          continue;
        }

        const category = String(row.category || "")
          .trim()
          .toLowerCase();
        if (
          !category ||
          !["aptitude", "technical", "psychometric"].includes(category)
        ) {
          errors.push({
            row: rowNum,
            field: "category",
            message: "Category must be aptitude, technical, or psychometric",
          });
          continue;
        }

        const subtopic = String(row.subtopic || "").trim();
        if (!subtopic) {
          errors.push({
            row: rowNum,
            field: "subtopic",
            message: "Subtopic is required",
          });
          continue;
        }

        const difficulty = String(row.difficulty || "")
          .trim()
          .toLowerCase();
        if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
          errors.push({
            row: rowNum,
            field: "difficulty",
            message: "Difficulty must be easy, medium, or hard",
          });
          continue;
        }

        // Parse options (support unlimited options dynamically)
        const options = [];
        let hasCorrectAnswer = false;

        // Dynamically find all option columns
        let optionIndex = 1;
        while (true) {
          const optionTextKey = `option${optionIndex}_text`;
          const optionIsCorrectKey = `option${optionIndex}_isCorrect`;
          
          // Check if this option column exists in the row
          if (!(optionTextKey in row)) {
            break; // No more option columns
          }

          const optionText = String(row[optionTextKey] || "").trim();
          const isCorrectStr = String(row[optionIsCorrectKey] || "")
            .trim()
            .toLowerCase();

          if (optionText) {
            const isCorrect =
              isCorrectStr === "true" ||
              isCorrectStr === "1" ||
              isCorrectStr === "yes";
            options.push({
              text: optionText,
              isCorrect: isCorrect,
            });

            if (isCorrect) {
              hasCorrectAnswer = true;
            }
          }
          
          optionIndex++;
        }

        // Validate options
        if (options.length < 2) {
          errors.push({
            row: rowNum,
            field: "options",
            message: "At least 2 options are required",
          });
          continue;
        }

        if (!hasCorrectAnswer) {
          errors.push({
            row: rowNum,
            field: "options",
            message: "At least one option must be marked as correct",
          });
          continue;
        }

        // Parse optional fields
        const tags = String(row.tags || "")
          .trim()
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);

        const details = String(row.details || "").trim();

        // Create question object matching DraftedQuestionSchema structure
        const question = {
          text,
          options,
          topic: topic, // Use the topic field from Excel
          subtopic,
          category,
          difficulty,
          tags: tags.length > 0 ? tags : undefined,
          details: details || undefined,
        };

        parsedQuestions.push(question);
      } catch (err) {
        errors.push({
          row: rowNum,
          message: `Error processing row: ${err.message}`,
        });
      }
    }

    console.log(
      `[BulkQuestion.parseUploadedFile] Parsed ${parsedQuestions.length} valid questions, ${errors.length} errors`
    );

    return res.json({
      success: true,
      data: {
        questions: parsedQuestions,
        totalRows: dataRows.length,
        validQuestions: parsedQuestions.length,
        errors: errors,
      },
    });
  } catch (err) {
    console.error("[BulkQuestion.parseUploadedFile] ✗ Error:", err.message);
    return res.status(500).json({
      success: false,
      message: `Failed to parse file: ${err.message}`,
    });
  }
};

module.exports = {
  generateTemplate,
  parseUploadedFile,
};
