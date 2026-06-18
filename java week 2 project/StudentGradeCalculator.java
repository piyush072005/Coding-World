import java.util.Scanner;

/**
 * Project 2 - Student Grade Calculator
 *
 * Calculates total marks, average percentage, and assigns a grade
 * for a student across multiple subjects.
 *
 * Technical Constraints Applied:
 *  - Buffer Trap Mitigation : Integer.parseInt(sc.nextLine()) pattern used throughout.
 *  - Defensive Validation   : Marks are validated (0–100) before accumulation.
 *  - Scalable Accumulation  : total += currentMark loop pattern.
 *  - Integer Division Guard : Explicit (double) cast during average calculation.
 *  - Grade Logic Ladder     : Exhaustive if-else, strictest condition checked first.
 *  - Clean Output           : System.out.printf with %.2f%% specifier.
 */
public class StudentGradeCalculator {

    // ─────────────────────────────────────────────────────────────
    //  Grade Classification (Rules Engine)
    //  Ordered strictly from highest to lowest threshold.
    // ─────────────────────────────────────────────────────────────
    private static String classifyGrade(double percentage) {
        if (percentage >= 90) {
            return "A+  (Outstanding)";
        } else if (percentage >= 80) {
            return "A   (Excellent)";
        } else if (percentage >= 70) {
            return "B   (Very Good)";
        } else if (percentage >= 60) {
            return "C   (Good)";
        } else if (percentage >= 50) {
            return "D   (Average)";
        } else if (percentage >= 40) {
            return "E   (Below Average)";
        } else {
            return "F   (Fail)";
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Validated Input Helper
    //  Keeps re-prompting until a valid mark (0–100) is entered.
    //  Uses nextLine() + Integer.parseInt() to dodge the buffer trap.
    // ─────────────────────────────────────────────────────────────
    private static int readValidMark(Scanner sc, String subjectName) {
        while (true) {
            System.out.print("  Enter marks for " + subjectName + " (0 – 100): ");
            String rawInput = sc.nextLine().trim();

            try {
                int mark = Integer.parseInt(rawInput);

                if (mark < 0 || mark > 100) {
                    System.out.println("  [ERROR] Marks must be between 0 and 100. "
                            + "You entered: " + mark + ". Please try again.");
                } else {
                    return mark;   // ✔ Valid mark — exit loop
                }

            } catch (NumberFormatException e) {
                System.out.println("  [ERROR] \"" + rawInput
                        + "\" is not a valid integer. Please enter a number.");
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Entry Point
    // ─────────────────────────────────────────────────────────────
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        // ── Banner ────────────────────────────────────────────────
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║       STUDENT GRADE CALCULATOR  v1.0         ║");
        System.out.println("╚══════════════════════════════════════════════╝");
        System.out.println();

        // ── Student Name ──────────────────────────────────────────
        System.out.print("Enter student name : ");
        String studentName = sc.nextLine().trim();

        // ── Number of Subjects ────────────────────────────────────
        int numSubjects = 0;
        while (numSubjects <= 0) {
            System.out.print("Enter number of subjects: ");
            String rawSubjects = sc.nextLine().trim();
            try {
                numSubjects = Integer.parseInt(rawSubjects);
                if (numSubjects <= 0) {
                    System.out.println("  [ERROR] Number of subjects must be at least 1.");
                }
            } catch (NumberFormatException e) {
                System.out.println("  [ERROR] \"" + rawSubjects
                        + "\" is not a valid number. Please try again.");
            }
        }

        // ── Collect Subject Names ─────────────────────────────────
        String[] subjects = new String[numSubjects];
        System.out.println();
        System.out.println("Enter subject names:");
        for (int i = 0; i < numSubjects; i++) {
            System.out.print("  Subject " + (i + 1) + " name: ");
            subjects[i] = sc.nextLine().trim();
            if (subjects[i].isEmpty()) {
                subjects[i] = "Subject " + (i + 1);   // default name
            }
        }

        // ── Collect & Validate Marks ──────────────────────────────
        int[] marks = new int[numSubjects];
        int total   = 0;                              // Accumulator

        System.out.println();
        System.out.println("Enter marks for each subject:");
        for (int i = 0; i < numSubjects; i++) {
            int currentMark = readValidMark(sc, subjects[i]);
            marks[i] = currentMark;
            total   += currentMark;                   // Scalable accumulation
        }

        // ── Calculate Average ─────────────────────────────────────
        // Explicit cast to double prevents integer division truncation.
        double average = (double) total / numSubjects;

        // ── Classify Grade ────────────────────────────────────────
        String grade = classifyGrade(average);

        // ── Output Report ─────────────────────────────────────────
        System.out.println();
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║               RESULT REPORT                  ║");
        System.out.println("╚══════════════════════════════════════════════╝");
        System.out.printf("  Student Name  : %s%n", studentName);
        System.out.printf("  Subjects      : %d%n", numSubjects);
        System.out.println();
        System.out.println("  ┌─────────────────────────────┬────────┐");
        System.out.println("  │ Subject                     │ Marks  │");
        System.out.println("  ├─────────────────────────────┼────────┤");
        for (int i = 0; i < numSubjects; i++) {
            System.out.printf("  │ %-27s │  %3d   │%n", subjects[i], marks[i]);
        }
        System.out.println("  └─────────────────────────────┴────────┘");
        System.out.println();
        System.out.printf("  Total Marks   : %d / %d%n", total, numSubjects * 100);
        System.out.printf("  Average       : %.2f%%%n", average);   // %.2f%% → literal %
        System.out.printf("  Grade         : %s%n", grade);
        System.out.println();
        System.out.println("══════════════════════════════════════════════");

        sc.close();
    }
}
