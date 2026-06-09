import java.util.InputMismatchException;
import java.util.Random;
import java.util.Scanner;

public class DecodeLabs_Java_P1 {

    private static final int MIN_NUMBER = 1;
    private static final int MAX_NUMBER = 100;
    private static final int MAX_ATTEMPTS = 7;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Random random = new Random();

        int wins = 0;
        int roundsPlayed = 0;
        boolean playAgain;

        System.out.println("========================================");
        System.out.println("   DecodeLabs - Number Guessing Game");
        System.out.println("========================================");
        System.out.println("I'm thinking of a number between " + MIN_NUMBER + " and " + MAX_NUMBER + ".");
        System.out.println("You have " + MAX_ATTEMPTS + " attempts per round.");
        System.out.println("Tip: Binary search solves 1-100 in ~7 guesses!\n");

        do {
            roundsPlayed++;
            int target = random.nextInt(MAX_NUMBER) + 1;
            boolean win = false;
            int attemptsUsed = 0;

            System.out.println("--- Round " + roundsPlayed + " ---");

            while (!win && attemptsUsed < MAX_ATTEMPTS) {
                int remaining = MAX_ATTEMPTS - attemptsUsed;
                System.out.print("Enter your guess (" + remaining + " attempt"
                        + (remaining == 1 ? "" : "s") + " left): ");

                int guess;
                try {
                    guess = scanner.nextInt();
                    scanner.nextLine();
                } catch (InputMismatchException e) {
                    System.out.println("Invalid input. Please enter a whole number.\n");
                    scanner.nextLine();
                    continue;
                }

                attemptsUsed++;

                if (guess == target) {
                    win = true;
                    wins++;
                    System.out.println("Correct! You guessed it in " + attemptsUsed + " attempt"
                            + (attemptsUsed == 1 ? "" : "s") + "!");
                } else if (guess > target) {
                    System.out.println("Too High.\n");
                } else {
                    System.out.println("Too Low.\n");
                }
            }

            if (!win) {
                System.out.println("Out of attempts! The number was " + target + ".");
            }

            System.out.println("Score: " + wins + " win" + (wins == 1 ? "" : "s")
                    + " out of " + roundsPlayed + " round" + (roundsPlayed == 1 ? "" : "s") + ".\n");

            playAgain = askPlayAgain(scanner);

        } while (playAgain);

        System.out.println("Thanks for playing! Final score: " + wins + "/" + roundsPlayed + ".");
        scanner.close();
    }

    private static boolean askPlayAgain(Scanner scanner) {
        while (true) {
            System.out.print("Play Again? [Y/N]: ");
            String response = scanner.nextLine().trim().toUpperCase();

            if (response.equals("Y") || response.equals("YES")) {
                System.out.println();
                return true;
            }
            if (response.equals("N") || response.equals("NO")) {
                return false;
            }

            System.out.println("Please enter Y or N.");
        }
    }
}
