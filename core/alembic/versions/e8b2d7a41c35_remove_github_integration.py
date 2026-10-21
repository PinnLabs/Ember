"""remove github integration

Revision ID: e8b2d7a41c35
Revises: d4a8f13c6e29

DESTRUCTIVE: drops github_connections and github_tracked_repos; stored GitHub
tokens and tracked-repo lists are deleted and downgrade() cannot restore them.
"""

from alembic import op
import sqlalchemy as sa

revision = "e8b2d7a41c35"
down_revision = "d4a8f13c6e29"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index("ix_github_tracked_repos_workspace_id", table_name="github_tracked_repos")
    op.drop_table("github_tracked_repos")
    op.drop_table("github_connections")


def downgrade():
    # Schema only; the dropped rows are gone.
    op.create_table(
        "github_connections",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("github_user_id", sa.BigInteger(), nullable=False),
        sa.Column("github_login", sa.String(120), nullable=False),
        sa.Column("avatar_url", sa.String(2048), nullable=True),
        sa.Column("scopes", sa.String(255), nullable=False, server_default=""),
        sa.Column("access_token_encrypted", sa.Text(), nullable=False),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("access_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_github_connections_user_id"),
    )
    op.create_table(
        "github_tracked_repos",
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("repo_id", sa.BigInteger(), nullable=False),
        sa.Column("owner", sa.String(120), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("added_by_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["added_by_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id", "repo_id", name="uq_github_tracked_repos_workspace_repo"
        ),
    )
    op.create_index(
        "ix_github_tracked_repos_workspace_id", "github_tracked_repos", ["workspace_id"]
    )
