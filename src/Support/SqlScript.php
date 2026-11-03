<?php

declare(strict_types=1);

namespace App\Support;

// Utilitário compartilhado por database/migrate.php e database/seed.php para
// dividir um arquivo .sql em statements individuais, respeitando strings entre
// aspas simples (que podem conter ';' literal, como em textos de descrição).
final class SqlScript
{
    /** @return list<string> */
    public static function splitStatements(string $sql): array
    {
        $withoutComments = self::stripLineComments($sql);

        $statements = [];
        $current = '';
        $inString = false;
        $length = strlen($withoutComments);

        for ($i = 0; $i < $length; $i++) {
            $char = $withoutComments[$i];

            if ($char === "'" && ($i === 0 || $withoutComments[$i - 1] !== '\\')) {
                $inString = !$inString;
            }

            if ($char === ';' && !$inString) {
                $statements[] = trim($current);
                $current = '';
                continue;
            }

            $current .= $char;
        }

        if (trim($current) !== '') {
            $statements[] = trim($current);
        }

        return array_filter($statements, static fn (string $s) => $s !== '');
    }

    private static function stripLineComments(string $sql): string
    {
        $lines = explode("\n", $sql);
        $clean = array_filter($lines, static fn (string $line) => !preg_match('/^\s*--/', $line));
        return implode("\n", $clean);
    }
}
