<?php

declare(strict_types=1);

namespace App\Controllers\Support;

use App\Http\Request;
use App\Http\Response;
use PDO;
use PDOException;

/**
 * Controller CRUD genérico para as tabelas transacionais (comercial, estoque,
 * produção, qualidade) que não têm regra de negócio própria além de
 * ler/criar/atualizar/excluir uma linha — evita repetir a mesma classe ~30
 * vezes para tabelas como customers, projects, quotes, purchase_orders etc.
 * Tabelas com regra de negócio real (ex: movimentação de estoque, recebimento
 * de compra) têm controller dedicado em vez de usar esta classe.
 */
class CrudController
{
    /**
     * @param list<string> $fillable colunas aceitas em create()/update(), nesta ordem de whitelist
     * @param list<string> $filterable colunas aceitas como filtro de igualdade em index()
     */
    public function __construct(
        protected readonly PDO $db,
        protected readonly string $table,
        protected readonly array $fillable,
        protected readonly array $filterable = [],
        protected readonly string $primaryKey = 'id',
        protected readonly string $orderBy = 'id DESC',
    ) {
    }

    /** @param array<string, string> $params */
    public function index(Request $request, array $params): void
    {
        $sql = "SELECT * FROM {$this->table} WHERE 1=1";
        $args = [];

        foreach ($this->filterable as $column) {
            $value = $request->input($column);
            if ($value === null || $value === '') {
                continue;
            }
            $sql .= " AND {$column} = ?";
            $args[] = $value;
        }

        $sql .= " ORDER BY {$this->orderBy} LIMIT 500";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($args);
        Response::json($stmt->fetchAll());
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): void
    {
        $row = $this->find($params[$this->primaryKey]);
        if ($row === null) {
            Response::error(ucfirst($this->table) . ' não encontrado(a).', 404);
        }
        Response::json($row);
    }

    /** @param array<string, string> $params */
    public function create(Request $request, array $params): void
    {
        $data = $this->onlyFillable($request->body());
        if ($data === []) {
            Response::error('Nenhum campo válido informado.', 422);
        }

        $columns = array_keys($data);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $columns) . ") VALUES ({$placeholders})";

        $stmt = $this->db->prepare($sql);
        $this->executeOrConflict($stmt, array_values($data));

        $row = $this->find((string) $this->db->lastInsertId());
        Response::json($row, 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): void
    {
        $existing = $this->find($params[$this->primaryKey]);
        if ($existing === null) {
            Response::error(ucfirst($this->table) . ' não encontrado(a).', 404);
        }

        $data = $this->onlyFillable($request->body());
        if ($data === []) {
            Response::error('Nenhum campo válido informado.', 422);
        }

        $assignments = implode(', ', array_map(static fn (string $c): string => "{$c} = ?", array_keys($data)));
        $sql = "UPDATE {$this->table} SET {$assignments} WHERE {$this->primaryKey} = ?";

        $stmt = $this->db->prepare($sql);
        $this->executeOrConflict($stmt, [...array_values($data), $params[$this->primaryKey]]);

        Response::json($this->find($params[$this->primaryKey]));
    }

    /** @param array<string, string> $params */
    public function delete(Request $request, array $params): void
    {
        $existing = $this->find($params[$this->primaryKey]);
        if ($existing === null) {
            Response::error(ucfirst($this->table) . ' não encontrado(a).', 404);
        }

        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?");
        $this->executeOrConflict($stmt, [$params[$this->primaryKey]]);

        Response::json(['deleted' => true]);
    }

    /**
     * Executa a statement e traduz violação de integridade referencial (FK) em
     * 409 com mensagem clara, em vez de deixar vazar como 500 genérico.
     *
     * @param list<mixed> $args
     */
    protected function executeOrConflict(\PDOStatement $stmt, array $args): void
    {
        try {
            $stmt->execute($args);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error(
                    'Operação viola uma restrição de integridade (registro referenciado por outra tabela, ou chave duplicada).',
                    409
                );
            }
            throw $e;
        }
    }

    /** @return array<string, mixed>|null */
    protected function find(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    protected function onlyFillable(array $body): array
    {
        $data = [];
        foreach ($this->fillable as $column) {
            if (array_key_exists($column, $body)) {
                $data[$column] = $body[$column];
            }
        }
        return $data;
    }
}
